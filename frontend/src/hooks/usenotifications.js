import { useCallback, useEffect, useState, useRef } from "react"
import { useAuth } from "./useAuth"
import { getAccessToken } from "../api/tokenStorage"
import { markRead, markAllRead } from "../api/notifications"
import axios from "axios"

export function useNotifications() {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const pageRef = useRef(0)
  const [hasMore, setHasMore] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getAuthHeader = () => {
    const token = getAccessToken()
    if (!token) return null

    return {
      Authorization: token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
    }
  }

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

    try {
      const res = await axios.get("http://localhost:8081/api/notifications", {
        params: {
          page: pageRef.current,
          size: 20
        },
        headers: getAuthHeader()
      })

      const newItems = res.data.data.notifications ?? []

      setNotifications(prev => [...prev, ...newItems])

      setHasMore(newItems.length === 20)

      pageRef.current += 1
    } finally {
      setLoading(false)
    }
  }, [])

  const initLoad = useCallback(async () => {
    setLoading(true)

    try {
      pageRef.current = 0
      setNotifications([])

      const res = await axios.get("http://localhost:8081/api/notifications", {
        params: {
          page: 0,
          size: 20
        },
        headers: getAuthHeader()
      })

      const data = res.data.data

      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)

      pageRef.current = 1
      setHasMore((data.notifications ?? []).length === 20)
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
  }
}