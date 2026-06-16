import { useCallback, useEffect, useState } from "react"
import { useAuth } from "./useAuth"
import { getAccessToken } from "../api/tokenStorage"
import axios from "axios"

export function useNotifications() {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAccessToken()

      if (!token) {
        console.log("NO TOKEN")
        return
      }

      const cleanToken = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`

      const res = await axios.get("http://localhost:8081/api/notifications", {
        headers: { Authorization: cleanToken }
      })

      const data = res.data.data

      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)

    } catch (e) {
      console.error(e)
      setError(e)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refetch()
    } else {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
    }
  }, [isAuthenticated, refetch])

  return { notifications, unreadCount, loading, error, refetch }
}