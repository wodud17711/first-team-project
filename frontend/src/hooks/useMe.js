/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 본연의 패턴. effect 안의 setState 는 isAuthenticated 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { getMe } from '../api/users'
import { useAuth } from './useAuth'
import { createSwrCache } from './swrCache'

// 페이지 재방문 시 "불러오는 중" 제거용 SWR 캐시 (swrCache.js 참조).
const _meCache = createSwrCache()

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
  const cached = _meCache.get('me')
  const [me, setMe] = useState(cached ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // background=true 면 캐시를 보여둔 채 조용히 재검증 (스피너 X).
  // 닉네임 수정 후 호출부의 refetch() 는 기존대로 loading 을 켠다.
  const refetch = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    setError(null)
    try {
      const data = await getMe()
      setMe(data)
      _meCache.set('me', data)
    } catch (e) {
      setError(e)
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // fetch-on-mount + isAuthenticated 변경 시 재조회/초기화.
  // 캐시가 있으면 즉시 표시하고 백그라운드 재검증 (SWR).
  useEffect(() => {
    if (isAuthenticated) {
      refetch(_meCache.has('me'))
    } else {
      setMe(null)
      setError(null)
      setLoading(false)
    }
  }, [isAuthenticated, refetch])

  return { me, loading, error, refetch }
}
