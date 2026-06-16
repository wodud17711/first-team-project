


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useNotifications } from "../../hooks/useNotifications"
import NotificationCard from "../../components/NotificationCard"

function Notifications() {

    const navigate = useNavigate()
    const { notifications, total, unreadCount, loading, error } = useNotifications()

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
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>

      
      {/* empty state */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <div className="text-[40px]">🔔</div>
          <p className="text-[14px]">
            아직 알림이 없어요. 댓글이나 좋아요가 달리면 여기서 확인할 수 있어요!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onClick={() => navigate(n.linkUrl)}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default Notifications