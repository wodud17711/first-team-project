/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 본연의 패턴(useWalkScore 와 동일). */
import { useCallback, useEffect, useState } from 'react'
import { getOptimalTime } from '../api/walk'
import { OPTIMAL_TIME_MOCK } from '../mocks/optimalTime.mock'
import { useAuth } from './useAuth'

/**
 * 최적 산책시간(시간대별 적합도 + 추천) fetch hook.
 * useWalkScore 와 동일한 계약/상태 모델을 따른다.
 *
 * ⚠️ 현재는 BE(#71 윤소윤 walk-score-api-sync) 머지 전이라 **mock 으로 동작**한다.
 *    BE 머지 후 아래 `USE_MOCK = false` 한 줄만 바꾸면 실제 GET /api/walk/optimal-time 로 전환된다.
 *    (mock 응답 형태는 실응답 data 와 동일: { slots, best })
 *
 * 사용 예:
 *   const firstDogId = dogs[0]?.dogId
 *   const { data, loading, notReady } = useOptimalTime(firstDogId)
 *   <OptimalTimeChart slots={data?.slots} best={data?.best}
 *                     loading={loading} notReady={notReady} hasDog={firstDogId != null} />
 *
 * @param {number|null|undefined} dogId
 * @returns {{data:{slots:Array,best:Array}|null, loading:boolean, error:Error|null, notReady:boolean, refetch:()=>Promise<void>}}
 */

// BE optimal-time 머지되면 false 로 바꿀 것. (mock 제거 시 import 도 함께 정리)
const USE_MOCK = true

export function useOptimalTime(dogId) {
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
      // mock 모드: 네트워크 없이 즉시 가짜 응답. (실전환 시 USE_MOCK=false)
      const result = USE_MOCK ? OPTIMAL_TIME_MOCK : await getOptimalTime(dogId)
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

  useEffect(() => {
    // mock 모드에선 인증 없이도 미리보기 가능하게 한다(개발용). 실전환 시 isAuthenticated 게이트 적용.
    if ((USE_MOCK || isAuthenticated) && dogId != null) {
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
