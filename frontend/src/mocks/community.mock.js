/**
 * 커뮤니티 mock 데이터 (docs/06-api-spec.md 커뮤니티 섹션)
 * ============================================================================
 * BE(#68 커뮤니티 게시판) 머지 전까지 카테고리탭+게시글 목록 FE 골격용 가짜 응답.
 * 형태는 실응답 data 와 동일.
 *   카테고리: { categoryId, name, subTags[] }
 *   목록    : { content: PostSummary[], page, size, totalElements, totalPages }
 *   PostSummary = { postId, category, subTag, title, author,
 *                   commentCount, likeCount, viewCount, thumbnailUrl, createdAt }
 *
 * BE 머지되면 hooks 의 USE_MOCK=false 로 바꾸면 이 파일은 더 이상 쓰이지 않는다.
 * 카테고리 정본 = CLAUDE.md(사료·간식 / 병원·영양제 / 산책로 추천 / 반려견 자랑 / 산책 메이트 찾기).
 */

/** @type {Array<{categoryId:number, name:string, subTags:string[]}>} */
export const CATEGORIES_MOCK = [
  { categoryId: 1, name: '사료/간식', subTags: ['건사료', '습식사료', '수제간식', '껌/덴탈'] },
  { categoryId: 2, name: '병원/영양제', subTags: ['병원후기', '영양제', '예방접종', '건강고민'] },
  { categoryId: 3, name: '산책로 추천', subTags: ['도심', '공원', '해변', '산'] },
  { categoryId: 4, name: '반려견 자랑', subTags: ['우리집막내', '댕스타그램', '발랄', '꿀잠'] },
  { categoryId: 5, name: '산책 메이트 찾기', subTags: ['소형견', '중형견', '대형견', '시간대'] },
]

/** @type {Array<object>} */
const POSTS = [
  { postId: 50, category: '사료/간식', subTag: '건사료', title: '포메라니안 사료 추천 좀 해주세요', author: '댕댕이맘', commentCount: 7, likeCount: 12, viewCount: 134, thumbnailUrl: null, createdAt: '2026-06-09T09:20:00' },
  { postId: 49, category: '산책로 추천', subTag: '해변', title: '광안리 새벽 산책 코스 공유합니다 🌊', author: '부산댕댕', commentCount: 4, likeCount: 23, viewCount: 210, thumbnailUrl: null, createdAt: '2026-06-09T07:05:00' },
  { postId: 48, category: '반려견 자랑', subTag: '꿀잠', title: '자다가 이런 자세로 자는 거 정상인가요', author: '초코아빠', commentCount: 11, likeCount: 41, viewCount: 388, thumbnailUrl: null, createdAt: '2026-06-08T22:40:00' },
  { postId: 47, category: '병원/영양제', subTag: '관절', title: '7살 노견 관절 영양제 추천', author: '몽이누나', commentCount: 5, likeCount: 9, viewCount: 96, thumbnailUrl: null, createdAt: '2026-06-08T18:12:00' },
  { postId: 46, category: '산책 메이트 찾기', subTag: '중형견', title: '주말 아침 대연동 산책 메이트 구해요', author: '리트리버집사', commentCount: 2, likeCount: 6, viewCount: 73, thumbnailUrl: null, createdAt: '2026-06-08T11:30:00' },
  { postId: 45, category: '사료/간식', subTag: '수제간식', title: '닭가슴살 육포 직접 만들어 먹여요 (레시피)', author: '요리하는집사', commentCount: 9, likeCount: 33, viewCount: 254, thumbnailUrl: null, createdAt: '2026-06-07T20:00:00' },
]

/**
 * 카테고리/서브태그/정렬을 mock 에서 클라이언트로 흉내낸다(실응답 형태로 감쌈).
 * @returns {{content:Array, page:number, size:number, totalElements:number, totalPages:number}}
 */
export function getPostsMock({ categoryId, subTag, sort = 'latest' } = {}) {
  const catName = CATEGORIES_MOCK.find((c) => c.categoryId === categoryId)?.name
  let content = POSTS.filter((p) => (catName ? p.category === catName : true))
                     .filter((p) => (subTag ? p.subTag === subTag : true))
  content = [...content].sort((a, b) =>
    sort === 'popular' ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt),
  )
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 }
}
