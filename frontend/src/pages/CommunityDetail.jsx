import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { usePost, useComments, likePost } from "../hooks/useCommunity"

// 상대 시간(방금/N분 전/N시간 전) → 그 이상은 YYYY/MM/DD. Community 목록과 동일 규칙.
function timeAgo(iso) {
  if (!iso) return "—"
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`
  return iso.slice(0, 10).replaceAll("-", "/")
}

function MetaCount({ icon, count }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-txtcolor-700">{icon}</span>
      <span className="text-txtcolor-300">{count ?? 0}</span>
    </span>
  )
}

// 댓글 1건 (대댓글이면 isReply=true → 들여쓰기 + 좌측 선)
function CommentItem({ comment, isReply, isLastReply, onReply }) {
  return (
    <div className={`relative w-full ${isReply ? "ml-8 pl-4" : ""}`}>
    {isReply && (
      <div
        className={`absolute left-0 w-[2px] bg-brand-200
          ${isLastReply ? "top-0 bottom-6" : "top-0 bottom-0"}`}
      />
    )}
      <div className="flex flex-col items-start w-full py-3 gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 shrink-0">
            {comment.authorProfileImageUrl ? (
              <img
                src={comment.authorProfileImageUrl}
                alt={comment.author}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full rounded-full bg-brand-100 text-brand-700
                          flex items-center justify-center text-[14px] font-bold"
              >
                {(comment.author ?? "익")[0]}
              </div>
            )}
          </div>
          <span className="text-[14px] font-semibold text-txtcolor-700">
            {comment.author ?? "익명"}
          </span>
          {comment.isMine && (
            <span className="px-2 py-[2px] rounded-full bg-sky-100 text-sky-600 text-[12px]">
              내 댓글
            </span>
          )}
          <span className="text-[12px] text-txtcolor-300">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="w-full text-[14px] text-gray-800 whitespace-pre-wrap">{comment.content}</p>
        {!isReply && (
          <button
            onClick={() => onReply(comment.commentId)}
            className="mt-1 text-[12px] text-txtcolor-300 hover:text-brand-700 transition"
          >
            답글
          </button>
        )}
      </div>
    </div>
  )
}

function CommunityDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const base = pathname.startsWith("/dev") ? "/dev/community" : "/community"

  const { post, loading, error, setPost } = usePost(postId)
  const { comments, submit } = useComments(postId)

  const location = useLocation()
  const from = location.state?.from

  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState(null) // 대댓글 대상 commentId
  const [replyText, setReplyText] = useState("")
  const [likeBusy, setLikeBusy] = useState(false)

  // 대댓글 더보기
  const [replyExpandMap, setReplyExpandMap] = useState({})
  const toggleReplies = (commentId) => {
    setReplyExpandMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }
  

  // 닉네임 옆 보호자 연차 표기
  const guardianLevelIcon = {
    BEGINNER: "새싹 보호자🌱",
    JUNIOR: "초보 보호자🦴",
    SENIOR: "숙련 보호자🐕",
    VETERAN: "베테랑 보호자🏆",
  }

  // 목록으로 눌렀을 때, 상세 페이지로 들어오기 전 페이지로 이동
  const backPath =
  from === "mypagePosts"
    ? "/mypage/posts"
    : from === "mypageComments"
      ? "/mypage/comments"
    : from === "mypageLikes"
    ? "/mypage/likes"
    : base

  // 좋아요 토글 (낙관적 X — 응답으로 갱신)
  const handleLike = async () => {
    if (!post || likeBusy) return
    setLikeBusy(true)
    try {
      const { liked, likeCount } = await likePost(post.postId, post.liked, post.likeCount)
      setPost((p) => ({ ...p, liked, likeCount }))
    } catch (e) {
      console.error(e)
    } finally {
      setLikeBusy(false)
    }
  }

  // 최상위 댓글 작성
  const handleComment = async () => {
    if (!text.trim()) return
    await submit(text.trim(), null)
    setText("")
    setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p))
  }

  // 대댓글 작성
  const handleReply = async (parentId) => {
    if (!replyText.trim()) return
    await submit(replyText.trim(), parentId)
    setReplyText("")
    setReplyTo(null)
    setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p))
  }

  if (loading) {
    return <div className="p-4 text-gray-400">불러오는 중...</div>
  }
  if (error || !post) {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <div className="text-[40px]">🐾</div>
          <p className="text-[14px]">게시글을 찾을 수 없어요.</p>
          <button
            onClick={() => navigate(base)}
            className="px-4 py-2 rounded-xl bg-sky-700 text-white text-[14px] font-bold"
          >
            목록으로
          </button>
        </div>
      </div>
    )
  }

  // 댓글 트리: 최상위 + parentCommentId 로 묶은 대댓글
  const roots = comments.filter((c) => c.parentCommentId == null)
  const repliesOf = (id) => comments.filter((c) => c.parentCommentId === id)

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">커뮤니티</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              사료·산책로·자랑·메이트까지, 견주끼리 나누는 이야기
            </p>
          </div>
        </div>
        {/* 목록 */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 absolute right-0 bottom-0 px-4 py-2 
                     rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
        >
          <img src="/list.png" alt="마이페이지" className="w-[20px] h-[20px] invert brightness-0"/> 
          목록으로
        </button>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />

      {/* 게시글 카드 */}
      <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-6">
        {/* 카테고리 · 서브태그 */}
        <div className="flex items-center gap-[6px] mb-4">
          <span className="px-2 py-[2px] rounded-full bg-sky-100 text-sky-600 text-[12px] font-medium">
            {typeof post.category === "object" ? post.category.name : post.category}
          </span>
          {post.subTag && (
            <span className="px-2 py-[2px] rounded-full bg-txtcolor-100/40 text-txtcolor-400 text-[12px]">
              #{post.subTag}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 items-start justify-between">
          {/* 제목 */}
          <h1 className="text-[24px] font-extrabold text-txtcolor-700">
            {post.title}
          </h1>
          {/* 메타 */}
          <div className="flex items-center justify-between w-full mb-3 pt-3 border-t border-dashed border-txtcolor-100">
            {/* 왼쪽 */}
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] shrink-0">
                {post.authorProfileImageUrl ? (
                  <img
                    src={post.authorProfileImageUrl}
                    alt={post.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full bg-brand-100 text-brand-700
                              flex items-center justify-center text-sm font-bold"
                  >
                    {(post.author ?? "익")[0]}
                  </div>
                )}
              </div>
              
              <span className="font-semibold text-[14px] text-txtcolor-700">
                {post.author ?? "익명"}
              </span>

              <div className="w-px h-3 bg-txtcolor-200" />

              <span className="text-[14px] text-txtcolor-300">
                {guardianLevelIcon[post.authorLevel]}
              </span>
            </div>

            {/* 오른쪽 */}
            <div className="flex items-center gap-5 text-[14px]">
              <div className="flex gap-2">
                <MetaCount icon="💬" count={post.commentCount} />
                <MetaCount icon="❤️" count={post.likeCount} />
                <MetaCount icon="👁" count={post.viewCount} />
              </div>

              <div className="w-px h-3 bg-txtcolor-200" />

              <span className="text-txtcolor-300">
                {timeAgo(post.createdAt)}
              </span>
            </div>
          </div>

        </div>

        <div className="mb-8 border-t border-txtcolor-100" />

        {/* 본문 */}
        <p className="text-[15px] leading-relaxed text-txtcolor-800 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* 이미지 */}
        {post.imageUrls?.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {post.imageUrls.map((url) => (
              <img key={url} src={url} className="w-full rounded-xl object-cover" />
            ))}
          </div>
        )}

        {/* 좋아요 */}
        <div className="flex items-center justify-center gap-4 mt-8 pt-5 border-t border-txtcolor-100">
          <button
            onClick={handleLike}
            disabled={likeBusy}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[14px] font-medium transition
              ${post.liked
                ? "bg-rose-50/70 border-rose-200 text-rose-500"
                : "bg-white border-txtcolor-100 text-txtcolor-400 hover:bg-gray-50"}`}
          >
            {post.liked ? "❤️" : "🤍"} 좋아요 {post.likeCount ?? 0}
          </button>
        </div>
      </div>

      {/* 댓글 */}
      <div className="mt-6">
        <h2 className="text-[16px] font-bold text-txtcolor-700 mb-3">
          댓글 {post.commentCount ?? roots.length + roots.reduce((n, r) => n + repliesOf(r.commentId).length, 0)}
        </h2>

        {/* 댓글 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleComment() }}
            placeholder="댓글을 입력하세요"
            className="flex-1 px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-100 text-[16px] text-txtcolor-700
              focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
          />
          <button
            onClick={handleComment}
            className="flex items-center gap-2 px-4 py-2 
                     rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
          >
            등록
          </button>
        </div>

        {/* 댓글 목록 */}
        {roots.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-txtcolor-300">
            첫 댓글을 남겨보세요!
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 divide-y">
            {roots.map((c) => {
              const replies = repliesOf(c.commentId)
              const isExpanded = replyExpandMap[c.commentId]
              const visibleReplies = isExpanded ? replies : replies.slice(0, 2)

              return (
                <div key={c.commentId} className="py-1">
                  <CommentItem comment={c} isReply={false} onReply={setReplyTo} />

                  {/* 대댓글 입력 */}
                  {replyTo === c.commentId && (
                    <div className="mb-3 flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReply(c.commentId)
                        }}
                        autoFocus
                        placeholder="답글을 입력하세요"
                        className="flex-1 px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-100 text-[14px] text-txtcolor-700
                                  focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                      />
                      <div className="flex gap-[6px]">
                        <button
                          onClick={() => handleReply(c.commentId)}
                          className="flex items-center gap-2 px-4 py-2 
                                    rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                                    shadow-sm transition hover:bg-txtcolor-900"
                        >
                          답글
                        </button>
                        <button
                          onClick={() => {
                            setReplyTo(null)
                            setReplyText("")
                          }}
                          className="flex items-center gap-2 px-4 py-2 
                                    rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                                    shadow-sm hover:bg-txtcolor-200/80 transition"
                        >
                          취소
                        </button>
                      </div>
                      
                    </div>
                  )}

                  {/* 대댓글 목록 */}
                  {visibleReplies.map((r, idx) => (
                    <CommentItem
                      key={r.commentId}
                      comment={r}
                      isReply
                      isLastReply={idx === visibleReplies.length - 1}
                    />
                  ))}

                  {/* 더보기 버튼 */}
                  {replies.length > 2 && (
                    <button
                      onClick={() => toggleReplies(c.commentId)}
                      className="ml-8 pb-3 text-[12px] text-txtcolor-300 hover:text-brand-700"
                    >
                      {isExpanded ? "답글 접기" : `답글 ${replies.length - 2}개 더보기`}
                    </button>
                  )}

                  
                </div>
              )})}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityDetail
