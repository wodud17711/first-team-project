/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 본연의 패턴. effect 안의 setState 는 isAuthenticated 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { getMe } from '../api/users'
import { useAuth } from './useAuth'

/**
 * 내 정보 fetch hook.
 *
 * 사용 예 (Home.jsx 헤더):
 *   const { me, loading, error, refetch } = useMe()
 *   <p>안녕하세요, {me?.nickname ?? '게스트'}님!</p>
 *
 * - 마운트 시 자동 호출
 * - isAuthenticated=false 면 호출 안 함 (불필요한 401 회피)
 * - 로그인/로그아웃 시 isAuthenticated 변경 → 자동 재조회/초기화
 * - 닉네임 수정 후엔 호출부에서 refetch() 호출
 *
 * @returns {{me: UserResponse|null, loading: boolean, error: Error|null, refetch: () => Promise<void>}}
 */
export function useMe() {
  const { isAuthenticated } = useAuth()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMe()
      setMe(data)
    } catch (e) {
      setError(e)
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // fetch-on-mount + isAuthenticated 변경 시 재조회/초기화.
  useEffect(() => {
    if (isAuthenticated) {
      refetch()
    } else {
      setMe(null)
      setError(null)
      setLoading(false)
    }
  }, [isAuthenticated, refetch])

  return { me, loading, error, refetch }
}
