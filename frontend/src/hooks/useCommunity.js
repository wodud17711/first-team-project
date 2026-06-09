/* eslint-disable react-hooks/set-state-in-effect -- fetch-on-mount 패턴(useDogs 와 동일). */
import { useEffect, useState } from 'react'
import { getCategories, getPosts } from '../api/community'
import { CATEGORIES_MOCK, getPostsMock } from '../mocks/community.mock'

// 커뮤니티 BE(#68) 머지되면 false 로 바꿀 것. (mock import 도 함께 정리)
const USE_MOCK = true

/**
 * 카테고리 + 서브태그 목록 fetch hook.
 * @returns {{categories: Array, loading: boolean, error: Error|null}}
 */
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const data = USE_MOCK ? CATEGORIES_MOCK : await getCategories()
        if (alive) setCategories(data ?? [])
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return { categories, loading, error }
}

/**
 * 게시글 목록 fetch hook. 필터(categoryId/subTag/sort) 변경 시 자동 재조회.
 * @param {{categoryId?:number, subTag?:string, sort?:'latest'|'popular'}} [filter]
 * @returns {{posts: Array, total: number, loading: boolean, error: Error|null}}
 */
export function usePosts({ categoryId, subTag, sort = 'latest' } = {}) {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = USE_MOCK
          ? getPostsMock({ categoryId, subTag, sort })
          : await getPosts({ categoryId, subTag, sort })
        if (alive) {
          setPosts(data?.content ?? [])
          setTotal(data?.totalElements ?? 0)
        }
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [categoryId, subTag, sort])

  return { posts, total, loading, error }
}
