import apiClient from "./Client"

// api notifications 호출
export const getNotifications = (params) =>
  apiClient.get("/notifications", { params })

// 알림 읽음 처리
export const markRead = (id) =>
  apiClient.patch(`/notifications/${id}/read`)

// 알림 전체 읽음 처리
export const markAllRead = () =>
  apiClient.patch("/notifications/read-all")