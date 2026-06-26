import { useState } from "react"



// 상대 시간(방금/N분 전/N시간 전) → 그 이상은 YYYY/MM/DD. 정선혜 날짜 표기(슬래시) 유지.
function timeAgo(iso) {
  if (!iso) return "—"
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`

  return iso.slice(0, 10).replaceAll("-", "/")
}

// 댓글 1건 카드 (목록 행)
function CommentCard({ group, onClick }) {

  const [expanded, setExpanded] = useState(false)
  const commentsToShow = expanded
        ? group.comments
        : group.comments.slice(0, 2)


  return (
    <div
      onClick={onClick}
      className="
        group gap-4 bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4
        cursor-pointer transition-all duration-200
        hover:-translate-y-[2px] hover:shadow-md
      "
    >
      {/* 원글 제목 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-[2px] rounded-full bg-sky-100 text-sky-600 text-[12px] font-medium">
          게시글
        </span>

        <span className="text-[16px] font-bold text-txtcolor-700 truncate
                        transition-colors duration-300 ease-out group-hover:text-brand-700">
          {group.postTitle}
        </span>
      </div>

      {/* 내가 쓴 댓글들 */}
      <div className="flex flex-col gap-2">
      {commentsToShow.map((comment) => (
        <div
          key={comment.commentId}
          className="pl-3 border-l-[3px] border-brand-200"
        >
          <div className="flex items-center gap-2">
            <p
              className={`text-[14px] text-txtcolor-700 ${
                expanded ? "line-clamp-3" : "line-clamp-1"
              }`}
            >
              {comment.content}
            </p>
            <span className="shrink-0 text-[12px] text-txtcolor-300">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
        </div>
      ))}
      </div>
      {group.comments.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="mt-3 text-[12px] text-txtcolor-300 hover:text-brand-700 font-medium"
        >
          {expanded
            ? "접기"
            : `외 ${group.comments.length - 2}개의 댓글 더보기`}
        </button>
      )}

      <div className="mt-3 text-[12px] text-gray-400">
        {timeAgo(group.comments[0]?.createdAt)}
      </div>
    </div>
  )
}

export default CommentCard