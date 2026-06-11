/* eslint-disable react-hooks/set-state-in-effect -- fetch-on-mount 패턴(useDogs 와 동일). */
import { useCallback, useEffect, useState } from 'react'
import {
  getCategories,
  getPosts,
  getPost,
  createPost,
  getComments,
  createComment,
  toggleLike,
} from '../api/community'
import {
  CATEGORIES_MOCK,
  getPostsMock,
  getPostMock,
  createPostMock,
  getCommentsMock,
  createCommentMock,
} from '../mocks/community.mock'

// 카테고리·게시글 CRUD(#68) develop 머지 → 실연동. 문제 시 true 로 즉시 롤백.
const USE_MOCK_POSTS = false
// 댓글·좋아요 BE 는 후속 PR. 그 전까지 mock 유지 (BE 나오면 false).
const USE_MOCK_SOCIAL = true

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
        const data = USE_MOCK_POSTS ? CATEGORIES_MOCK : await getCategories()
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
        const data = USE_MOCK_POSTS
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

/**
 * 게시글 상세 fetch hook. liked/likeCount 는 좋아요 토글로 로컬 갱신 가능.
 * @param {number|string} postId
 * @returns {{post:object|null, loading:boolean, error:Error|null, setPost:Function}}
 */
export function usePost(postId) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const raw = USE_MOCK_POSTS ? getPostMock(postId) : await getPost(postId)
        if (!raw) throw new Error('POST_NOT_FOUND')
        // 실응답(PostResponse)은 category 명을 categoryName 으로 줌 → FE 가 읽는 category 로 정규화
        const data = { ...raw, category: raw.category ?? raw.categoryName }
        if (alive) setPost(data)
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [postId])

  return { post, loading, error, setPost }
}

/**
 * 댓글 목록 fetch hook + 작성 헬퍼. 작성 후 목록 자동 재조회.
 * @param {number|string} postId
 * @returns {{comments:Array, loading:boolean, error:Error|null,
 *            submit:(content:string, parentCommentId?:number|null)=>Promise<void>}}
 */
export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = USE_MOCK_SOCIAL ? getCommentsMock(postId) : await getComments(postId)
      setComments(data ?? [])
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    let alive = true
    ;(async () => { if (alive) await load() })()
    return () => { alive = false }
  }, [load])

  const submit = useCallback(
    async (content, parentCommentId = null) => {
      const body = { content, parentCommentId, createdAt: new Date().toISOString() }
      if (USE_MOCK_SOCIAL) createCommentMock(postId, body)
      else await createComment(postId, { content, parentCommentId })
      await load()
    },
    [postId, load],
  )

  return { comments, loading, error, submit }
}

/**
 * 글 작성 액션. 성공 시 새 postId 반환(상세로 이동용).
 * @param {{categoryId:number, subTag?:string, title:string, content:string, imageUrls?:string[]}} body
 * @returns {Promise<number>} 생성된 postId
 */
export async function submitPost(body) {
  if (USE_MOCK_POSTS) {
    const created = createPostMock({ ...body, createdAt: new Date().toISOString() })
    return created.postId
  }
  const created = await createPost(body)
  return created.postId
}

/**
 * 좋아요 토글 액션. { liked, likeCount } 반환.
 * 좋아요 BE(후속 PR) 전까지는 로컬 토글(현재 카운트 기준 ±1)로 동작.
 * @param {number|string} postId
 * @param {boolean} currentlyLiked
 * @param {number} currentLikeCount 현재 표시 중인 좋아요 수 (mock 계산용)
 */
export async function likePost(postId, currentlyLiked, currentLikeCount = 0) {
  if (USE_MOCK_SOCIAL) {
    return { liked: !currentlyLiked, likeCount: currentLikeCount + (currentlyLiked ? -1 : 1) }
  }
  return toggleLike(postId, currentlyLiked)
}
