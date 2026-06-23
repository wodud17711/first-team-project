/* eslint-disable react-hooks/set-state-in-effect --
   타이머 tick·dogId 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { startWalk, endWalk, getWalkHistory } from '../api/walk'

/**
 * 산책 기록 세션 hook (웹 = GPS 없는 타이머+수동 기록).
 *
 * 여러 마리를 함께 데리고 나간 한 번의 산책 = 강아지마다 walk 레코드 1건씩(BE 는
 * 반려견당 단일 walk 모델·미종료 1건만 허용). 진행 중 세션들은 localStorage 에
 * [{walkId, dogId, startTime}] 배열로 보관해 새로고침해도 타이머가 복구된다.
 *
 * 흐름: start([dogId..]) → 진행 중(타이머) → finish({distanceKm, thermal, memo}) → 전부 종료(같은 정보).
 * 체감(thermal)은 docs/11 컨벤션(userFeedback JSON)으로 직렬화해 룰베이스 v2 수집과 연결.
 */
const STORAGE_KEY = 'daengion.activeWalk'

function loadSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(raw)) return raw
    if (raw && raw.walkId) return [raw] // 구버전 단일 객체 호환
    return []
  } catch {
    return []
  }
}

export function useWalkRecord() {
  // sessions = [{walkId, dogId, startTime}] (빈 배열 = idle)
  const [sessions, setSessions] = useState(loadSessions)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const isActive = sessions.length > 0
  const activeDogIds = sessions.map((s) => s.dogId)

  // 진행 중이면 가장 이른 startTime 기준 경과초를 1초마다 갱신.
  useEffect(() => {
    if (sessions.length === 0) {
      setElapsedSec(0)
      return
    }
    const startMs = Math.min(...sessions.map((s) => new Date(s.startTime).getTime()))
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sessions])

  // dogIds: number[] — 선택한 강아지마다 walk 동시 시작.
  const start = useCallback(async (dogIds) => {
    const ids = (Array.isArray(dogIds) ? dogIds : [dogIds]).filter((d) => d != null)
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const results = await Promise.allSettled(ids.map((id) => startWalk(id)))
      const started = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => ({ walkId: r.value.walkId, dogId: r.value.dogId, startTime: r.value.startTime }))
      const failed = results.filter((r) => r.status === 'rejected')

      if (started.length === 0) {
        const e = failed[0]?.reason
        setError(e ?? new Error('산책을 시작하지 못했어요.'))
        throw e ?? new Error('start failed')
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(started))
      setSessions(started)
      // 일부만 실패해도 시작된 산책은 진행 — 비차단 안내만.
      if (failed.length > 0) {
        setError({
          message: `일부 반려견은 산책을 시작하지 못했어요 (${failed.length}마리). 진행 중인 산책이 있는지 확인해주세요.`,
        })
      }
      return started
    } finally {
      setBusy(false)
    }
  }, [])

  /**
   * 진행 중인 모든 산책을 같은 거리·체감·메모로 종료.
   * @param {{distanceKm?: number|string, thermal?: 'HOT'|'OK'|'COLD', memo?: string}} input
   */
  const finish = useCallback(
    async ({ distanceKm, thermal, memo } = {}) => {
      if (sessions.length === 0) return null
      setBusy(true)
      setError(null)
      try {
        // 체감은 수집용 JSON(docs/11 §1.3)으로. 메모는 note 로 함께 담아 정성 분석에 활용.
        const userFeedback = thermal
          ? JSON.stringify({ thermal, ...(memo ? { note: memo } : {}) })
          : null
        const body = {
          distanceKm: distanceKm === '' || distanceKm == null ? null : Number(distanceKm),
          memo: memo || null,
          userFeedback,
        }
        const results = await Promise.allSettled(sessions.map((s) => endWalk(s.walkId, body)))
        // WALK_NOT_FOUND(이미 종료/DB 리셋) 는 정상 처리로 간주, 그 외 실패만 집계.
        const realFailures = results.filter(
          (r) => r.status === 'rejected' && r.reason?.errorCode !== 'WALK_NOT_FOUND',
        )
        if (realFailures.length === sessions.length) {
          // 전부 실패 → 로컬 유지(재시도 가능) + 에러 노출.
          const e = realFailures[0].reason
          setError(e)
          throw e
        }
        localStorage.removeItem(STORAGE_KEY)
        setSessions([])
        if (realFailures.length > 0) {
          setError({ message: `일부 산책 저장에 실패했어요 (${realFailures.length}건).` })
        }
        return true
      } finally {
        setBusy(false)
      }
    },
    [sessions],
  )

  // 서버엔 종료됐는데 로컬에만 진행 중으로 남은 경우 등, 로컬 상태만 비운다.
  const clearLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSessions([])
  }, [])

  return { sessions, isActive, activeDogIds, elapsedSec, busy, error, start, finish, clearLocal }
}

/**
 * 반려견별 산책 이력 hook. dogId 변경 시 자동 재조회.
 */
export function useWalkHistory(dogId) {
  const [walks, setWalks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (dogId == null) {
      setWalks([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setWalks(await getWalkHistory(dogId))
    } catch (e) {
      setError(e)
      setWalks([])
    } finally {
      setLoading(false)
    }
  }, [dogId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { walks, loading, error, refetch }
}

/** 경과초 → "MM:SS" 또는 "H:MM:SS". */
export function formatElapsed(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** userFeedback(JSON 문자열)에서 thermal 라벨 추출. 파싱 실패/없음이면 null. */
export function parseThermal(userFeedback) {
  if (!userFeedback) return null
  try {
    const t = JSON.parse(userFeedback)?.thermal
    return t === 'HOT' || t === 'OK' || t === 'COLD' ? t : null
  } catch {
    return null
  }
}
