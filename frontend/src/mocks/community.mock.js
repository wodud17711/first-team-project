/**
 * 커뮤니티 mock 데이터 (docs/06-api-spec.md 커뮤니티 섹션)
 * ============================================================================
 * BE(#68 커뮤니티 게시판) 머지 전까지 목록·상세·글작성·댓글 FE 골격용 가짜 응답.
 * 형태는 실응답 data 와 동일.
 *   카테고리: { categoryId, name, subTags[] }
 *   목록    : { content: PostSummary[], page, size, totalElements, totalPages }
 *   PostSummary = { postId, category, subTag, title, author,
 *                   commentCount, likeCount, viewCount, thumbnailUrl, createdAt }
 *   상세    : { postId, category, subTag, title, content, author, imageUrls[],
 *               commentCount, likeCount, viewCount, liked, isMine, createdAt }
 *   댓글    : { commentId, author, content, parentCommentId, isMine, createdAt }
 *
 * 세션 동안 글작성/댓글/좋아요가 "라이브"하게 반영되도록 모듈 내 가변 배열을 쓴다
 * (dev 미리보기에서 작성한 글이 목록·상세에 바로 보이게). 새로고침하면 초기화.
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

/**
 * 게시글 저장소 (가변). content/imageUrls 까지 들고 있어 상세도 여기서 만든다.
 * @type {Array<object>}
 */
const POSTS = [
  { postId: 50, categoryId: 1, category: '사료/간식', subTag: '건사료', title: '포메라니안 사료 추천 좀 해주세요', content: '4살 포메라니안 키우고 있는데 요즘 입맛이 까다로워졌어요. 알레르기 없는 무난한 건사료 있을까요? 다들 어떤 거 먹이시는지 궁금합니다 🙏', author: '댕댕이맘', imageUrls: [], commentCount: 7, likeCount: 12, viewCount: 134, liked: false, isMine: false, createdAt: '2026-06-09T09:20:00' },
  { postId: 49, categoryId: 3, category: '산책로 추천', subTag: '해변', title: '광안리 새벽 산책 코스 공유합니다 🌊', content: '광안리 해변 새벽 6시쯤이 사람도 적고 모래도 시원해서 댕댕이가 정말 좋아해요. 다이아몬드브릿지 보면서 한 바퀴 돌면 딱 30분. 배변봉투 꼭 챙기시고 물도 한 통!', author: '부산댕댕', imageUrls: [], commentCount: 4, likeCount: 23, viewCount: 210, liked: false, isMine: false, createdAt: '2026-06-09T07:05:00' },
  { postId: 48, categoryId: 4, category: '반려견 자랑', subTag: '꿀잠', title: '자다가 이런 자세로 자는 거 정상인가요', content: '배 보이고 네 다리 쫙 펴고 자는데... 너무 무방비라 웃겨요 ㅋㅋ 다들 이렇게 자나요?', author: '초코아빠', imageUrls: [], commentCount: 11, likeCount: 41, viewCount: 388, liked: true, isMine: false, createdAt: '2026-06-08T22:40:00' },
  { postId: 47, categoryId: 2, category: '병원/영양제', subTag: '영양제', title: '7살 노견 관절 영양제 추천', content: '슬슬 계단 오를 때 머뭇거리는 게 보여서 관절 영양제 시작하려고요. 글루코사민 위주로 보고 있는데 실제로 효과 보신 분 계신가요?', author: '몽이누나', imageUrls: [], commentCount: 5, likeCount: 9, viewCount: 96, liked: false, isMine: false, createdAt: '2026-06-08T18:12:00' },
  { postId: 46, categoryId: 5, category: '산책 메이트 찾기', subTag: '중형견', title: '주말 아침 대연동 산책 메이트 구해요', content: '대연동 거주하고 중형견(보더콜리) 키워요. 주말 아침 8~9시쯤 같이 산책하실 분 있을까요? 사회성 좋은 친구라 다른 댕댕이랑도 잘 지내요!', author: '리트리버집사', imageUrls: [], commentCount: 2, likeCount: 6, viewCount: 73, liked: false, isMine: false, createdAt: '2026-06-08T11:30:00' },
  { postId: 45, categoryId: 1, category: '사료/간식', subTag: '수제간식', title: '닭가슴살 육포 직접 만들어 먹여요 (레시피)', content: '닭가슴살 얇게 저며서 60도 식품건조기에 6시간이면 끝! 첨가물 없어서 안심이고 우리 댕댕이가 환장합니다. 사진은 댓글에 추가할게요.', author: '요리하는집사', imageUrls: [], commentCount: 9, likeCount: 33, viewCount: 254, liked: false, isMine: false, createdAt: '2026-06-07T20:00:00' },
]

/** 게시글별 댓글 저장소 (가변). key=postId */
const COMMENTS = {
  50: [
    { commentId: 9001, author: '말티즈러버', content: '저희는 오리지널 연어 사료 먹이는데 잘 맞아요!', parentCommentId: null, isMine: false, createdAt: '2026-06-09T09:40:00' },
    { commentId: 9002, author: '댕댕이맘', content: '오 연어 좋네요 한번 찾아볼게요 감사합니다 :)', parentCommentId: 9001, isMine: true, createdAt: '2026-06-09T09:52:00' },
    { commentId: 9003, author: '수의사선생님', content: '알레르기 있으면 단일단백 사료부터 테스트해보세요.', parentCommentId: null, isMine: false, createdAt: '2026-06-09T10:15:00' },
  ],
  49: [
    { commentId: 9101, author: '해운대댕', content: '광안리 새벽 진짜 명당이죠 ㅎㅎ 정보 감사해요!', parentCommentId: null, isMine: false, createdAt: '2026-06-09T07:30:00' },
  ],
  48: [
    { commentId: 9201, author: '시바월드', content: 'ㅋㅋㅋㅋ 완전 정상이에요 편하다는 뜻!', parentCommentId: null, isMine: false, createdAt: '2026-06-08T22:55:00' },
  ],
}

/** 새 id 발급용 카운터 (Date.now/Math.random 미사용 — 단순 증가). */
let nextPostId = 51
let nextCommentId = 9500

/**
 * 카테고리/서브태그/정렬을 mock 에서 클라이언트로 흉내낸다(실응답 형태로 감쌈).
 * @returns {{content:Array, page:number, size:number, totalElements:number, totalPages:number}}
 */
export function getPostsMock({ categoryId, subTag, sort = 'latest' } = {}) {
  let content = POSTS.filter((p) => (categoryId ? p.categoryId === categoryId : true))
                     .filter((p) => (subTag ? p.subTag === subTag : true))
                     .map(toSummary)
  content = [...content].sort((a, b) =>
    sort === 'popular' ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt),
  )
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 }
}

/** 상세 1건. 없으면 null (호출부에서 404 취급). 조회수 +1 흉내. */
export function getPostMock(postId) {
  const p = POSTS.find((x) => x.postId === Number(postId))
  if (!p) return null
  p.viewCount += 1
  return { ...p }
}

/** 댓글 목록 (생성 시각 오름차순). */
export function getCommentsMock(postId) {
  return [...(COMMENTS[Number(postId)] ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
}

/**
 * 글 작성. categoryId/subTag/title/content/imageUrls 를 받아 저장 후 상세 형태 반환.
 * createdAt 은 호출부(브라우저)에서 ISO 로 넘겨받는다 (이 파일은 Date 직접 사용 안 함).
 */
export function createPostMock({ categoryId, subTag, title, content, imageUrls = [], createdAt }) {
  const cat = CATEGORIES_MOCK.find((c) => c.categoryId === Number(categoryId))
  const post = {
    postId: nextPostId++,
    categoryId: Number(categoryId),
    category: cat?.name ?? '기타',
    subTag: subTag || null,
    title,
    content,
    author: '나',
    imageUrls,
    commentCount: 0,
    likeCount: 0,
    viewCount: 0,
    liked: false,
    isMine: true,
    createdAt,
  }
  POSTS.unshift(post)
  return { ...post }
}

/** 댓글 작성 (parentCommentId 있으면 대댓글). 상위 글 commentCount 증가. */
export function createCommentMock(postId, { content, parentCommentId = null, createdAt }) {
  const pid = Number(postId)
  const comment = {
    commentId: nextCommentId++,
    author: '나',
    content,
    parentCommentId: parentCommentId ?? null,
    isMine: true,
    createdAt,
  }
  if (!COMMENTS[pid]) COMMENTS[pid] = []
  COMMENTS[pid].push(comment)
  const post = POSTS.find((x) => x.postId === pid)
  if (post) post.commentCount += 1
  return { ...comment }
}

/** 좋아요 토글. { liked, likeCount } 반환 (실 API POST/DELETE 흉내). */
export function toggleLikeMock(postId) {
  const post = POSTS.find((x) => x.postId === Number(postId))
  if (!post) return { liked: false, likeCount: 0 }
  post.liked = !post.liked
  post.likeCount += post.liked ? 1 : -1
  return { liked: post.liked, likeCount: post.likeCount }
}

/** 상세 레코드 → 목록 요약(thumbnailUrl 은 첫 이미지). */
function toSummary(p) {
  return {
    postId: p.postId,
    category: p.category,
    subTag: p.subTag,
    title: p.title,
    author: p.author,
    commentCount: p.commentCount,
    likeCount: p.likeCount,
    viewCount: p.viewCount,
    thumbnailUrl: p.imageUrls?.[0] ?? null,
    createdAt: p.createdAt,
  }
}
