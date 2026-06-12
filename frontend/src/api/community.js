/**
 * 커뮤니티 API — BE CategoryController/PostController (/api/categories, /api/posts) 매핑.
 *
 * 목록·카테고리는 비인증 조회 가능(client.js 가 토큰 있으면 첨부). 작성/좋아요는 인증 필요.
 * 응답 DTO 정본 = docs/06-api-spec.md 커뮤니티 섹션.
 *
 * ⚠️ 커뮤니티 BE(#68)는 머지 전이라, 현재는 hooks 의 USE_MOCK 으로 mock 동작.
 *    BE 머지 후 hooks 의 USE_MOCK=false 로 바꾸면 이 함수들이 실제로 호출된다.
 */
import apiClient from './client'

/**
 * 카테고리 + 서브태그 목록. GET /api/categories
 * @returns {Promise<Array<{categoryId:number, name:string, subTags:string[]}>>}
 */
export async function getCategories() {
  return apiClient.get('/categories')
}

/**
 * 게시글 목록(카테고리/서브태그 필터 + 정렬 + 페이지).
 * GET /api/posts?categoryId=&subTag=&sort=&page=&size=
 *
 * @param {object} [params]
 *   - categoryId (선택), subTag (선택), sort ('latest'|'popular'), page, size
 * @returns {Promise<{content:Array, page:number, size:number, totalElements:number, totalPages:number}>}
 *   content[i] = { postId, category, subTag, title, author,
 *                  commentCount, likeCount, viewCount, thumbnailUrl, createdAt }
 */
export async function getPosts(params = {}) {
  return apiClient.get('/posts', { params })
}

/**
 * 게시글 상세. GET /api/posts/{postId}
 * @returns {Promise<{postId:number, category:object|string, subTag:string,
 *   title:string, content:string, author:string, imageUrls:string[],
 *   commentCount:number, likeCount:number, viewCount:number,
 *   liked:boolean, isMine:boolean, createdAt:string}>}
 */
export async function getPost(postId) {
  return apiClient.get(`/posts/${postId}`)
}

/**
 * 게시글 작성. POST /api/posts (인증 필요)
 * @param {{categoryId:number, subTag?:string, title:string, content:string, imageUrls?:string[]}} body
 * @returns {Promise<{postId:number, category:object, subTag:string, title:string, createdAt:string}>}
 */
export async function createPost(body) {
  return apiClient.post('/posts', body)
}

/**
 * 댓글 목록. GET /api/posts/{postId}/comments
 * @returns {Promise<Array<{commentId:number, author:string, content:string,
 *   parentCommentId:number|null, isMine:boolean, createdAt:string}>>}
 */
export async function getComments(postId) {
  return apiClient.get(`/posts/${postId}/comments`)
}

/**
 * 댓글/대댓글 작성. POST /api/posts/{postId}/comments (인증 필요)
 * @param {{content:string, parentCommentId?:number|null}} body
 */
export async function createComment(postId, body) {
  return apiClient.post(`/posts/${postId}/comments`, body)
}

/**
 * 게시글 좋아요 토글. 단일 POST — 서버가 있으면 취소, 없으면 추가 (#89, v3.5).
 * POST /api/posts/{postId}/likes (인증 필요)
 * @returns {Promise<{postId:number, likeCount:number, liked:boolean}>}
 */
export async function toggleLike(postId) {
  return apiClient.post(`/posts/${postId}/likes`)
}
