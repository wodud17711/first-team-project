import { useCallback, useEffect, useState, useRef } from "react"
import { useAuth } from "./useAuth"
import { getNotifications, markRead, markAllRead } from "../api/notifications"

export function useNotifications() {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const pageRef = useRef(0)
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

  const loadMore = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // apiClient 경유 — baseURL·401 자동 갱신 적용. 성공 시 data(payload) 직접 반환.
      const data = await getNotifications({
        page: pageRef.current,
        size: 20,
      })

      const newItems = data?.notifications ?? []

      setNotifications(prev => [...prev, ...newItems])

      setHasMore(newItems.length === 20)

      pageRef.current += 1
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const initLoad = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      pageRef.current = 0
      setNotifications([])

      const data = await getNotifications({
        page: 0,
        size: 20,
      })

      const items = data?.notifications ?? []

      setNotifications(items)
      setUnreadCount(data?.unreadCount ?? 0)

      pageRef.current = 1
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
