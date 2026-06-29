import { onImgError, HUMAN_FALLBACK } from "../utils/imageFallback"

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
  // 닉네임 bold 처리
  const parts = notification.content?.split("님이 ")

  const detailClass = notification.isRead
  ? "bg-txtcolor-50/50 border-txtcolor-50 text-txtcolor-500"
  : "bg-white border-brand-100 text-txtcolor-500"


  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 rounded-xl border shadow-sm 
        cursor-pointer transition-all duration-200
        hover:-translate-y-[2px] hover:shadow-md
        ${notification.isRead ? "bg-white border-txtcolor-100/50" : "bg-brand-50 border-brand-200"}
      `}
    >
      {/* 상단: 타입 + 제목 */}
      <div className="flex justify-between items-start">
        <div>
          {/* 좋아요, 댓글 남긴 유저 프로필 사진 */}
          <img
            src={notification.actor?.profileImageUrl || "/userpanel/humanProfile.png"}
            alt={notification.actor?.nickname}
            onError={onImgError(HUMAN_FALLBACK)}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />

          {/* @@님이 회원님의 글에 댓글을 남겼습니다(or 글을 좋아합니다) */}
          <p
            className={`text-[14px] mt-1 ${
              notification.isRead
                ? "text-txtcolor-500"
                : "text-brand-800"
            }`}
          >
            <span
              className={`font-semibold ${
                notification.isRead
                  ? "text-txtcolor-700"
                  : "text-brand-700"
              }`}
            >
              {notification.actor?.nickname}
            </span>

            {notification.type === "LIKE"
              ? notification.actorCount > 1
                ? `님 외 ${notification.actorCount - 1}명이 회원님의 글을 좋아합니다.`
                : "님이 회원님의 글을 좋아합니다."
              : "님이 회원님의 글에 댓글을 남겼습니다."}
          </p>
        </div>
      </div>

      {/* 댓글 알림 → 댓글 내용 */}
      {notification.type === "COMMENT" && notification.comment?.content && (
        <p className={`p-3 rounded-lg border text-[14px] mt-2 truncate ${detailClass}`}>
          💬 {notification.comment.content}
        </p>
      )}

      {/* 좋아요 알림 → 게시글 제목 */}
      {notification.type === "LIKE" && notification.post?.title && (
        <p className={`p-3 rounded-lg border text-[14px] mt-2 truncate ${detailClass}`}>
          📄 {notification.post.title}
        </p>
      )}

      {/* 시간 */}
      <p className="text-[12px] text-txtcolor-300 mt-3">
        {timeAgo(notification.createdAt)}
      </p>
    </div>
  )
}

export default NotificationCard