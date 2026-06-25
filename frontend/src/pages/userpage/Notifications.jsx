


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48
import { useEffect, useRef, useState, useMemo } from "react"
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
    <div className="flex gap-2 overflow-x-auto">
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
  const { notifications, unreadCount, loading, error, hasMore, loadMore,
          markNotificationRead, markAllNotificationsRead, refetch
  } = useNotifications()

  // 카테고리
  const [filter, setFilter] = useState("all")
  const filteredNotifications = notifications.filter((n) => {
    const type = (n.type || "").toUpperCase()

    if (filter === "all") return true

    if (filter === "like")
      return type.includes("LIKE")

    if (filter === "comment")
      return type.includes("COMMENT")

    return true
  })

  const list = filteredNotifications

  // 페이지 젤 상,하단으로 이동
  const lastScrollY = useRef(0)
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(true)

  // 좋아요 카드 중복제거(같은 게시글은 하나의 카드로)
  const mergedNotifications = useMemo(() => {
    const map = {}

    notifications.forEach((n) => {
      if (n.type === "LIKE") {
        const key = `LIKE-${n.post?.id}`

        if (!map[key]) {
          map[key] = {
            ...n,
            actorCount: n.actorCount || 1,
          }
        } else {
          map[key].actorCount = Math.max(map[key].actorCount || 1, n.actorCount || 1)
          map[key].createdAt = n.createdAt
          map[key].isRead = map[key].isRead && n.isRead
        }

      } else {
        map[`C-${n.notificationId}`] = n
      }
    })

    return Object.values(map)
  }, [notifications])

  const merged = useMemo(() => {
    const map = {}

    notifications.forEach((n) => {
      if (n.type === "LIKE") {
        const key = `LIKE-${n.post?.id}`

        if (!map[key]) {
          map[key] = {
            ...n,
            actorCount: n.actorCount || 1,
          }
        } else {
          map[key].actorCount = Math.max(
            map[key].actorCount || 1,
            n.actorCount || 1
          )
          map[key].createdAt = n.createdAt
          map[key].isRead = map[key].isRead && n.isRead
        }
      } else {
        map[`C-${n.notificationId}`] = n
      }
    })

    return Object.values(map)
  }, [notifications])


const filtered = useMemo(() => {
  return merged.filter((n) => {
    const type = (n.type || "").toUpperCase()

    if (filter === "all") return true
    if (filter === "like") return type.includes("LIKE")
    if (filter === "comment") return type.includes("COMMENT")

    return true
  })
}, [merged, filter])


const handleLoadMore = async (e) => {
  e.preventDefault()

  const prevScroll = window.scrollY

  await loadMore()

  requestAnimationFrame(() => {
    window.scrollTo({ top: prevScroll, behavior: "auto" })
  })
}

  useEffect(() => {
  const handleScroll = () => {
    const currentY = window.scrollY
    const windowHeight = window.innerHeight
    const fullHeight = document.documentElement.scrollHeight

    // 위아래로 스크롤 중
    const scrollingUp = currentY < lastScrollY.current
    const scrollingDown = currentY > lastScrollY.current

      if (scrollingUp) {
        setShowTop(currentY > 300)
        setShowBottom(false)
      }

      if (scrollingDown) {
        setShowBottom(currentY + windowHeight < fullHeight - 300)
        setShowTop(false)
      }

      lastScrollY.current = currentY
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  
    // 👉 로딩/빈 데이터 상태 UI
    if (loading) {
        return (
        <div className="p-6 text-center text-txtcolor-500">
            불러오는 중...
        </div>
        )
    }
    
    if (error) {
        return (
        <div className="p-6 text-center text-txtcolor-500">
            알람을 가져오는데 문제가 생겼어요! 🐶
            <div className="mt-4">
            <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                          shadow-sm transition hover:bg-txtcolor-900"
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
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            알림
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              나의 게시글에 달린 댓글과 좋아요를 확인할 수 있어요.
            </p>
          </div>
        </div>
        {/* 등록수 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm 
                        border border-txtcolor-100/50">
          <p className="text-[12px] font-semibold text-txtcolor-400">안 읽은 알림</p>
          <p className="text-[20px] font-bold text-brand-700">{unreadCount ?? 0}개</p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-txtcolor-400/40 mb-[20px]'/>


      {/* 카테고리 + 모두읽음 */}
      <div className="flex items-center gap-2 mb-[20px]">
        <NotificationTabs selected={filter} onSelect={setFilter} />
        <button
          onClick={async () => {
            await markAllNotificationsRead()
            window.dispatchEvent(new Event("notifications-updated"))
          }}
          className="px-4 py-2 rounded-xl bg-txtcolor-700 
                     text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
        >
          모두 읽음
        </button>
      </div>

      
      {/* empty state */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-txtcolor-300">
          <div className="text-[40px]">🔔</div>
          <p className="text-[14px]">
            아직 알림이 없어요. 댓글이나 좋아요가 달리면 여기서 확인할 수 있어요!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((n) => (
            <NotificationCard
              key={`${n.notificationId ?? ''}-${n.createdAt}`}
              notification={n}
              onClick={async () => {
                await markNotificationRead(n.notificationId)
                window.dispatchEvent(new Event("notifications-updated"))

                if (n.linkUrl) {
                  navigate(n.linkUrl.replace("/posts/", "/community/"))
                }
              }}
            />
          ))}
          {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 rounded-xl bg-txtcolor-700 
                        text-white text-[14px] font-bold
                        shadow-sm transition hover:bg-txtcolor-900"
            >
              더보기
            </button>
          </div>
        )}
        </div>
      )}
      {/* 페이지 젤 상단, 하단으로 이동 */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 bg-txtcolor-700 hover:bg-txtcolor-900
                    text-white px-3 py-2 rounded-full transition"
        >
          ↑
        </button>
      )}

      {showBottom && (
        <button
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth"
            })
          }
          className="fixed bottom-6 right-6 bg-txtcolor-700 hover:bg-txtcolor-900 
                    text-white px-3 py-2 rounded-full transition"
        >
          ↓
        </button>
      )}

    </div>
  )
}

export default Notifications