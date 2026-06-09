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
