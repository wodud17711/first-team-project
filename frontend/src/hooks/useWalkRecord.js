/* eslint-disable react-hooks/set-state-in-effect --
   타이머 tick·dogId 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { startWalk, endWalk, getWalkHistory } from '../api/walk'

/**
 * 산책 기록 세션 hook (웹 = GPS 없는 타이머+수동 기록).
 *
 * 진행 중 산책은 브라우저 localStorage 에 {walkId, dogId, startTime} 로 보관해
 * 새로고침해도 경과 타이머가 복구된다. (BE 는 반려견당 미종료 1건만 허용 — start 시 409 방지)
 *
 * 흐름: start(dogId) → 진행 중(타이머) → finish({distanceKm, thermal, memo}) → 종료.
 * 체감(thermal)은 docs/11 컨벤션(userFeedback JSON)으로 직렬화해 룰베이스 v2 수집과 연결.
 */
const STORAGE_KEY = 'daengion.activeWalk'

function loadActive() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function useWalkRecord() {
  // active = {walkId, dogId, startTime} | null
  const [active, setActive] = useState(loadActive)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // 진행 중이면 startTime 기준 경과초를 1초마다 갱신.
  useEffect(() => {
    if (!active) {
      setElapsedSec(0)
      return
    }
    const tick = () =>
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000)),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [active])

  const start = useCallback(async (dogId) => {
    setBusy(true)
    setError(null)
    try {
      const res = await startWalk(dogId)
      const session = { walkId: res.walkId, dogId: res.dogId, startTime: res.startTime }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setActive(session)
      return res
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setBusy(false)
    }
  }, [])

  /**
   * @param {{distanceKm?: number|string, thermal?: 'HOT'|'OK'|'COLD', memo?: string}} input
   */
  const finish = useCallback(
    async ({ distanceKm, thermal, memo } = {}) => {
      if (!active) return null
      setBusy(true)
      setError(null)
      try {
        // 체감은 수집용 JSON(docs/11 §1.3)으로. 메모는 note 로 함께 담아 정성 분석에 활용.
        const userFeedback = thermal
          ? JSON.stringify({ thermal, ...(memo ? { note: memo } : {}) })
          : null
        const res = await endWalk(active.walkId, {
          distanceKm: distanceKm === '' || distanceKm == null ? null : Number(distanceKm),
          memo: memo || null,
          userFeedback,
        })
        localStorage.removeItem(STORAGE_KEY)
        setActive(null)
        return res
      } catch (e) {
        setError(e)
        throw e
      } finally {
        setBusy(false)
      }
    },
    [active],
  )

  // 서버엔 종료됐는데 로컬에만 진행 중으로 남은 경우 등, 로컬 상태만 비운다.
  const clearLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setActive(null)
  }, [])

  return { active, elapsedSec, busy, error, start, finish, clearLocal }
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
