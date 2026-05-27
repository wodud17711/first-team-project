import axios from 'axios'
import { getAccessToken, setAccessToken, removeAccessToken } from './tokenStorage'
import { BusinessError } from './errors'

/**
 * Axios 인스턴스 + 인터셉터.
 *
 * 요청
 * - localStorage 의 AT 를 Bearer 로 자동 첨부
 * - withCredentials: true — RT HttpOnly 쿠키(Path=/api/auth) 자동 송수신
 *
 * 응답
 * - BE 표준 응답 {success, data, message, errorCode}
 *   - success=true  → response.data 에서 data 만 꺼내 반환 (호출부는 바로 사용)
 *   - success=false → BusinessError 로 reject
 * - 401 발생 시 자동 /auth/refresh 호출 → 새 AT 받아 원래 요청 재시도
 * - /refresh 자체가 실패하면 토큰 제거 + 로그인 페이지로 이동
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 10000,
  withCredentials: true, // RT 쿠키 송수신
  headers: {
    'Content-Type': 'application/json',
  },
})

// ===== 요청 인터셉터: AT 자동 첨부 =====
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ===== 응답 인터셉터: ApiResponse 풀기 + 401 자동 갱신 =====
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        return Promise.reject(
          new BusinessError({
            message: body.message,
            errorCode: body.errorCode,
            status: response.status,
          }),
        )
      }
      return body.data // success=true 면 data 만 반환
    }
    return body // 비표준 응답은 그대로
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // 401 자동 갱신 (단, /refresh 자체와 이미 재시도한 요청은 제외)
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        // /auth/refresh — withCredentials 로 RT 쿠키 자동 송신
        const newToken = await apiClient.post('/auth/refresh')
        setAccessToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original) // 원래 요청 재시도
      } catch (refreshErr) {
        removeAccessToken()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      }
    }

    // ApiResponse 형식 에러 응답이면 BusinessError 로 변환
    const body = error.response?.data
    if (body && typeof body === 'object' && 'success' in body) {
      return Promise.reject(
        new BusinessError({
          message: body.message || error.message,
          errorCode: body.errorCode,
          status,
        }),
      )
    }
    return Promise.reject(error)
  },
)

export default apiClient
