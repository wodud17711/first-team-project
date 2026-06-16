function NotificationCard({ notification, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition
        ${notification.isRead ? "bg-white" : "bg-sky-50 border-sky-200"}
      `}
    >
      {/* 상단: 타입 + 제목 */}
      <div className="flex justify-between items-start">
        
        <div>
          <p className="text-[14px] font-medium text-gray-800">
            {notification.title}
          </p>

          <p className="text-[13px] text-gray-600 mt-1">
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
          👉 게시글 보기
        </p>
      )}

      {/* 시간 */}
      <p className="text-[11px] text-gray-400 mt-2">
        {notification.createdAt}
      </p>
    </div>
  )
}

export default NotificationCard