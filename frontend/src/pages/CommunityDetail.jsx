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

// 댓글 1건 (대댓글이면 isReply=true → 들여쓰기 + 좌측 선)
function CommentItem({ comment, isReply, onReply }) {
  return (
    <div className={isReply ? "ml-8 pl-4 border-l-2 border-sky-100" : ""}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-semibold text-gray-700">
            {comment.author ?? "익명"}
          </span>
          {comment.isMine && (
            <span className="px-[6px] py-[1px] rounded-full bg-sky-100 text-sky-700 text-[11px]">
              내 댓글
            </span>
          )}
          <span className="text-[12px] text-gray-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[14px] text-gray-800 whitespace-pre-wrap">{comment.content}</p>
        {!isReply && (
          <button
            onClick={() => onReply(comment.commentId)}
            className="mt-1 text-[12px] text-gray-400 hover:text-sky-700 transition"
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
    <div className="p-4 animate-fadeIn max-w-[820px]">

      {/* 뒤로 */}
      <button
        onClick={() => navigate(backPath)}
        className="mb-4 text-[14px] text-gray-500 hover:text-sky-700 transition"
      >
        ← 목록으로
      </button>

      {/* 게시글 카드 */}
      <div className="bg-white rounded-xl border shadow-sm px-6 py-6">
        {/* 카테고리 · 서브태그 */}
        <div className="flex items-center gap-[6px] mb-3">
          <span className="px-2 py-[2px] rounded-full bg-sky-100 text-sky-700 text-[12px] font-medium">
            {typeof post.category === "object" ? post.category.name : post.category}
          </span>
          {post.subTag && (
            <span className="px-2 py-[2px] rounded-full bg-gray-100 text-gray-500 text-[12px]">
              #{post.subTag}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 className="text-[24px] font-extrabold text-gray-800 mb-2">{post.title}</h1>

        {/* 메타 */}
        <div className="flex items-center gap-3 text-[13px] text-gray-400 mb-5">
          <span className="text-gray-600 font-medium">{post.author ?? "익명"}</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span>👁 {post.viewCount ?? 0}</span>
        </div>

        {/* 본문 */}
        <p className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap">
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
        <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t">
          <button
            onClick={handleLike}
            disabled={likeBusy}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[14px] font-medium transition
              ${post.liked
                ? "bg-rose-50 border-rose-200 text-rose-500"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            {post.liked ? "❤️" : "🤍"} 좋아요 {post.likeCount ?? 0}
          </button>
        </div>
      </div>

      {/* 댓글 */}
      <div className="mt-6">
        <h2 className="text-[16px] font-bold text-sky-800 mb-3">
          댓글 {post.commentCount ?? roots.length + roots.reduce((n, r) => n + repliesOf(r.commentId).length, 0)}
        </h2>

        {/* 댓글 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleComment() }}
            placeholder="댓글을 입력하세요"
            className="flex-1 px-3 py-3 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[14px]
              focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
          />
          <button
            onClick={handleComment}
            className="px-4 py-2 rounded-xl bg-sky-700 text-white text-[14px] font-bold shrink-0 hover:bg-sky-800 transition"
          >
            등록
          </button>
        </div>

        {/* 댓글 목록 */}
        {roots.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-gray-400">
            첫 댓글을 남겨보세요!
          </p>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm px-5 divide-y">
            {roots.map((c) => (
              <div key={c.commentId} className="py-1">
                <CommentItem comment={c} isReply={false} onReply={setReplyTo} />

                {/* 대댓글 목록 */}
                {repliesOf(c.commentId).map((r) => (
                  <CommentItem key={r.commentId} comment={r} isReply />
                ))}

                {/* 대댓글 입력 */}
                {replyTo === c.commentId && (
                  <div className="ml-8 pl-4 mb-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReply(c.commentId) }}
                      autoFocus
                      placeholder="답글을 입력하세요"
                      className="flex-1 px-3 py-2 bg-[#f7f7f7] rounded-lg border border-gray-100 text-[13px]
                        focus:outline-brand-300 transition"
                    />
                    <button
                      onClick={() => handleReply(c.commentId)}
                      className="px-3 py-1 rounded-lg bg-sky-600 text-white text-[13px] font-bold shrink-0"
                    >
                      답글
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityDetail
