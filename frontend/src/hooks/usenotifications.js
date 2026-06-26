import { useCallback, useEffect, useState, useRef } from "react"
import { useAuth } from "./useAuth"
import { getNotifications, markRead, markAllRead } from "../api/notifications"

export function useNotifications() {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const pageRef = useRef({
    all: 0,
    like: 0,
    comment: 0,
  })
  const [hasMore, setHasMore] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const markNotificationRead = async (id) => {
    await markRead(id)

    setNotifications(prev =>
      prev.map(n =>
        n.notificationId === id
          ? { ...n, isRead: true }
          : n
      )
    )

    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllNotificationsRead = async () => {
    await markAllRead()

    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        isRead: true,
      }))
    )

    setUnreadCount(0)
  }

  const loadMore = useCallback(async (type = "all") => {
    setLoading(true)
    setError(null)

    try {
      const page = pageRef.current[type]

      const data = await getNotifications({
        page,
        size: 20,
        type: type === "all" ? null : type.toUpperCase(),
      })

      const newItems = data?.notifications ?? []

      setNotifications(prev =>
        page === 0 ? newItems : [...prev, ...newItems]
      )

      setHasMore(newItems.length === 20)

      pageRef.current[type] += 1
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const initLoad = useCallback(async (type = "all") => {
    setLoading(true)
    setError(null)

    try {
      pageRef.current[type] = 0
      setNotifications([])

      const data = await getNotifications({
        page: 0,
        size: 20,
        type: type === "all" ? null : type.toUpperCase(),
      })

      const items = data?.notifications ?? []

      setNotifications(items)
      setUnreadCount(data?.unreadCount ?? 0)

      pageRef.current[type] = 1
      setHasMore(items.length === 20)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    initLoad()
  }, [isAuthenticated, initLoad])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,

    markNotificationRead,
    markAllNotificationsRead,

    refetch: initLoad,
  }
}
