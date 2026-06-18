/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 패턴. effect 안 setState 는 dogId/period 동기화 의도. */
import { useEffect, useState } from 'react'
import { getWalkStatistics, getWalkCalendar } from '../api/walk'
import { useAuth } from './useAuth'

/**
 * 산책 통계 fetch hook (특정 반려견·구간).
 *
 * @param {number|null|undefined} dogId
 * @param {'WEEK'|'MONTH'} period
 * @returns {{data: object|null, loading: boolean, error: Error|null}}
 *   data = { totalWalks, totalMinutes, totalDistance, avgDuration, achievementRate,
 *            dailyBreakdown[], previous{} }
 */
export function useWalkStatistics(dogId, period = 'WEEK') {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || dogId == null) {
      setData(null)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    getWalkStatistics(dogId, period)
      .then((res) => alive && setData(res))
      .catch((e) => alive && (setError(e), setData(null)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [isAuthenticated, dogId, period])

  return { data, loading, error }
}

/**
 * 산책 캘린더 fetch hook (특정 반려견·연월).
 *
 * @param {number|null|undefined} dogId
 * @param {number} year
 * @param {number} month  1~12
 * @returns {{data: object|null, loading: boolean, error: Error|null}}
 *   data = { year, month, days: [{date, count, minutes}] }
 */
export function useWalkCalendar(dogId, year, month) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || dogId == null) {
      setData(null)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    getWalkCalendar(dogId, year, month)
      .then((res) => alive && setData(res))
      .catch((e) => alive && (setError(e), setData(null)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [isAuthenticated, dogId, year, month])

  return { data, loading, error }
}
