function NotificationCard({ notification, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition
        ${notification.isRead ? "bg-white" : "bg-sky-50 border-sky-200"}
      `}
    >
      <div className="flex justify-between">
        <p className="text-[14px] text-gray-800">
          {notification.message}
        </p>

        {!notification.isRead && (
          <span className="text-[10px] text-sky-600 font-bold">
            NEW
          </span>
        )}
      </div>

      <p className="text-[12px] text-gray-400 mt-1">
        {notification.createdAt}
      </p>
    </div>
  )
}
export default NotificationCard