import { useEffect, useState } from "react"
import axios from "axios"

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)

        const res = await axios.get("/api/notifications")

        const data = res.data.data

        setNotifications(data?.notifications ?? [])
        setUnreadCount(data?.unreadCount ?? 0)

      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
  }
}