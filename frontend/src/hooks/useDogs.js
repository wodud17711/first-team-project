/* eslint-disable react-hooks/set-state-in-effect --
   fetch-on-mount hook 본연의 패턴. effect 안의 setState 는 isAuthenticated 동기화 의도. */
import { useCallback, useEffect, useState } from 'react'
import { listDogs } from '../api/dogs'
import { useAuth } from './useAuth'
import { createSwrCache } from './swrCache'

// 페이지 재방문 시 "불러오는 중" 제거용 SWR 캐시 (swrCache.js 참조).
const _dogsCache = createSwrCache()

/**
 * 내 반려견 목록 fetch hook.
 *
 * 사용 예 (Home.jsx 우측 강아지 카드):
 *   const { dogs, loading, error, refetch } = useDogs()
 *   {dogs.map((dog) => (
 *     <DogCard key={dog.id} dog={dog} />
 *   ))}
 *
 * DogResponse 필드 (api/dogs.js 주석 참조):
 *   { id, name, breed:{id,nameKr,...}, birthDate, ageYears, weight,
 *     gender, isNeutered, activityLevel, healthNotes, profileImageUrl, createdAt }
 *
 * - 마운트 시 자동 호출
 * - 미인증 시 빈 배열 유지
 * - 등록/수정/삭제 후엔 호출부에서 refetch() 호출
 *
 * @returns {{dogs: DogResponse[], loading: boolean, error: Error|null, refetch: () => Promise<void>}}
 */
export function useDogs() {
  const { isAuthenticated } = useAuth()
  const cached = _dogsCache.get('dogs')
  const [dogs, setDogs] = useState(cached ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // background=true 면 캐시를 보여둔 채 조용히 재검증 (스피너 X).
  // 등록/수정/삭제 후 호출부의 refetch() 는 기존대로 loading 을 켠다.
  const refetch = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    setError(null)
    try {
      const data = await listDogs()
      setDogs(data ?? [])
      _dogsCache.set('dogs', data ?? [])
    } catch (e) {
      setError(e)
      setDogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  // fetch-on-mount + isAuthenticated 변경 시 재조회/초기화.
  // 캐시가 있으면 즉시 표시하고 백그라운드 재검증 (SWR).
  useEffect(() => {
    if (isAuthenticated) {
      refetch(_dogsCache.has('dogs'))
    } else {
      setDogs([])
      setError(null)
      setLoading(false)
    }
  }, [isAuthenticated, refetch])

  return { dogs, loading, error, refetch }
}
