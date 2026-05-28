/**
 * Access Token 저장소.
 * 현재는 localStorage (단순). 보안 강화 시 메모리(전역 변수)로 교체 가능 —
 * 그때도 이 모듈의 함수 시그니처만 유지하면 호출부 영향 X.
 *
 * 같은 탭에서는 'storage' 이벤트가 발생하지 않으므로, set/remove 시점에
 * 커스텀 'auth-changed' 이벤트를 dispatch 한다. AuthProvider 가 이걸 받아
 * isAuthenticated 를 자동 갱신.
 */

const KEY = 'accessToken'
const AUTH_EVENT = 'auth-changed'

const notify = () => window.dispatchEvent(new Event(AUTH_EVENT))

export const getAccessToken = () => localStorage.getItem(KEY)

export const setAccessToken = (token) => {
  localStorage.setItem(KEY, token)
  notify()
}

export const removeAccessToken = () => {
  localStorage.removeItem(KEY)
  notify()
}

export const AUTH_CHANGED_EVENT = AUTH_EVENT
