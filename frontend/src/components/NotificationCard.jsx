
// 상대 시간(방금/N분 전/N시간 전) → 그 이상은 YYYY/MM/DD. 정선혜 날짜 표기(슬래시) 유지.
function timeAgo(iso) {
  if (!iso) return "—"
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`

  return iso.slice(0, 10).replaceAll("-", "/")
}

function NotificationCard({ notification, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 rounded-xl border shadow-sm 
        cursor-pointer transition-all duration-200
        hover:-translate-y-[2px] hover:shadow-md
        ${notification.isRead ? "bg-white" : "bg-sky-50 border-sky-200"}
      `}
    >
      {/* 상단: 타입 + 제목 */}
      <div className="flex justify-between items-start">
        <div>
          {/* 새 댓글(or 좋아요) */}
          {/* <p className="text-[14px] font-medium text-gray-800">
            {notification.title}
          </p> */}

          {/* @@님이 회원님의 글에 댓글을 남겼습니다(or 글을 좋아합니다) */}
          <p className="text-[14px] text-gray-600 mt-1">
            {notification.content}
          </p>
        </div>

        {/* NEW 뱃지 */}
        {!notification.isRead && (
          <span className="text-[10px] text-sky-600 font-bold">
            NEW
          </span>
        )}
      </div>

      {/* 링크 대상 (게시글) */}
      {notification.linkUrl && (
        <p className="text-[12px] text-sky-500 mt-2">
          게시글 보기
        </p>
      )}

      {/* 시간 */}
      <p className="text-[12px] text-gray-400 mt-3">
        {timeAgo(notification.createdAt)}
      </p>
    </div>
  )
}

export default NotificationCard