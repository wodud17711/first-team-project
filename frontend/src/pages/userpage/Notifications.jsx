


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useNotifications } from "../../hooks/usenotifications"
import NotificationCard from "../../components/NotificationCard"

// api 연결
import { markRead } from "../../api/notifications"


// 카테고리 탭
function NotificationTabs({ selected, onSelect }) {
  const base =
    "px-4 py-[6px] rounded-full text-[14px] font-bold whitespace-nowrap transition"

  const tabs = [
    { key: "all", label: "전체" },
    { key: "like", label: "좋아요" },
    { key: "comment", label: "댓글" },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto mb-[30px]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={`${base} ${
            selected === t.key
              ? "bg-sky-700 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}


function Notifications() {

  const navigate = useNavigate()
  const { notifications, unreadCount, loading, error, filterNotifications,
          markNotificationRead, markAllNotificationsRead, refetch
  } = useNotifications()

  // 카테고리
  const [filter, setFilter] = useState("all")
    const filteredNotifications = notifications.filter((n) => {
    const type = (n.type || "").toUpperCase()

    if (filter === "all") return true
    if (filter === "like") return n.type === "LIKE"
    if (filter === "comment") return n.type === "COMMENT"
    return true
  })

  const list = filteredNotifications

    // 👉 로딩/빈 데이터 상태 UI
    if (loading) {
        return (
        <div className="p-6 text-center text-gray-500">
            불러오는 중...
        </div>
        )
    }
    
    if (error) {
        return (
        <div className="p-6 text-center text-gray-500">
            알람을 가져오는데 문제가 생겼어요! 🐶
            <div className="mt-4">
            <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-sky-500 text-white rounded-xl"
            >
                홈으로
            </button>
            </div>
        </div>
        )
    }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            알림
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              나의 게시글에 달린 댓글과 좋아요를 확인할 수 있어요.
            </p>
          </div>
        </div>

        {/* 우측 통계 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border min-w-[120px]">
          <p className="text-[12px] text-gray-500">안 읽은 알림</p>
          <p className="text-[20px] font-bold text-sky-700">
            {unreadCount ?? 0}개
          </p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-4'/>

      {/* 카테고리 + 모두읽음 */}
      <div className="flex items-center gap-2">
        <NotificationTabs selected={filter} onSelect={setFilter} />
        <button
          onClick={async () => {
            await markAllNotificationsRead()
            await refetch()
            window.dispatchEvent(new Event("notifications-updated"))
          }}
          className="
            px-3 py-2
            text-[12px]
            rounded-lg
            border
            text-gray-600
            hover:bg-gray-50
          "
        >
          모두 읽음
        </button>
      </div>

      
      {/* empty state */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <div className="text-[40px]">🔔</div>
          <p className="text-[14px]">
            아직 알림이 없어요. 댓글이나 좋아요가 달리면 여기서 확인할 수 있어요!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((n) => (
            <NotificationCard
              key={`${n.notificationId ?? ''}-${n.createdAt}`}
              notification={n}
              onClick={async () => {
                await markNotificationRead(n.notificationId)
                await refetch()
                window.dispatchEvent(new Event("notifications-updated"))
                const path = n.linkUrl.replace("/posts/", "/community/")
                navigate(path)
              }}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default Notifications