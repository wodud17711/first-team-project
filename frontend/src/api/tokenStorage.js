/**
 * Access Token 저장소.
 * 현재는 localStorage (단순). 보안 강화 시 메모리(전역 변수)로 교체 가능 —
 * 그때도 이 모듈의 함수 시그니처만 유지하면 호출부 영향 X.
 */

const KEY = 'accessToken'

export const getAccessToken = () => localStorage.getItem(KEY)
export const setAccessToken = (token) => localStorage.setItem(KEY, token)
export const removeAccessToken = () => localStorage.removeItem(KEY)
