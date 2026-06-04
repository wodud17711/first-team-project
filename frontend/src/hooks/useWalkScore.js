/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 본연의 패턴. effect 안의 setState 는 dogId/isAuthenticated 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { getWalkScore } from '../api/walk'
import { useAuth } from './useAuth'

/**
 * 산책 위험도 점수 fetch hook (특정 반려견 기준).
 *
 * 사용 예 (Home.jsx 산책지수 카드):
 *   const firstDogId = dogs[0]?.dogId
 *   const { data, loading, notReady } = useWalkScore(firstDogId)
 *   <WalkScore score={data?.score} level={data?.level} reasons={data?.topReasons}
 *              loading={loading} notReady={notReady} hasDog={firstDogId != null} />
 *
 * - dogId 가 있고 인증 상태일 때만 호출 (없으면 초기화)
 * - dogId 변경 시 자동 재조회
 * - 날씨 스냅샷 미집계(WEATHER_API_ERROR)는 에러가 아니라 notReady=true 로 구분
 *   → 카드에서 "날씨 데이터 준비 중" 안내. (날씨 집계 배선 후 자동 정상화)
 *
 * @param {number|null|undefined} dogId
 * @returns {{data: object|null, loading: boolean, error: Error|null, notReady: boolean, refetch: () => Promise<void>}}
 */
export function useWalkScore(dogId) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notReady, setNotReady] = useState(false)

  const refetch = useCallback(async () => {
    if (dogId == null) return
    setLoading(true)
    setError(null)
    setNotReady(false)
    try {
      const result = await getWalkScore(dogId)
      setData(result)
    } catch (e) {
      // 날씨 스냅샷 0개 → 집계 배선 전이라 "준비 중"으로 취급 (에러 카드 X).
      if (e?.errorCode === 'WEATHER_API_ERROR') {
        setNotReady(true)
        setData(null)
      } else {
        setError(e)
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [dogId])

  // fetch-on-mount + dogId/isAuthenticated 변경 시 재조회/초기화.
  useEffect(() => {
    if (isAuthenticated && dogId != null) {
      refetch()
    } else {
      setData(null)
      setError(null)
      setNotReady(false)
      setLoading(false)
    }
  }, [isAuthenticated, dogId, refetch])

  return { data, loading, error, notReady, refetch }
}
