/**
 * 인증 API — BE AuthController (/api/auth) 매핑.
 *
 * 모든 함수는 BusinessError 를 throw 할 수 있음. 호출부에서 try/catch 또는
 * useLogin/useSignup hook 이 알아서 잡음.
 */
import apiClient from './client'
import { setAccessToken, removeAccessToken } from './tokenStorage'

/**
 * 회원가입.
 * @param {{email:string, password:string, nickname?:string}} payload
 *   nickname 은 윤소윤 nickname PR 머지 후 활성화 — 현재는 보내도 BE 가 무시.
 * @returns {Promise<string>} accessToken (자동으로 localStorage 에도 저장)
 */
// export async function signup({ email, password, nickname }) {
//   const accessToken = await apiClient.post('/auth/signup', { email, password, nickname })
//   setAccessToken(accessToken)
//   return accessToken
// }
export async function signup({ email, password, nickname, guardianLevel }) {
  const accessToken = await apiClient.post('/auth/signup', {
    email,
    password,
    nickname,
    guardianLevel,
  })

  setAccessToken(accessToken)

  return accessToken
}

/**
 * 로그인.
 * @returns {Promise<string>} accessToken (자동 저장)
 */
// export async function login({ email, password }) {
//   const accessToken = await apiClient.post('/auth/login', { email, password })
//   setAccessToken(accessToken)
//   return accessToken
// }
export async function login({ email, password }) {
  const accessToken = await apiClient.post('/auth/login', { email, password })

  setAccessToken(accessToken)

  return accessToken
}

/**
 * 회원가입 이메일 인증 코드 발송 (6자리, 10분 유효, 재발송 60초 쿨다운).
 */
export async function sendEmailCode(email) {
  await apiClient.post('/auth/email/send-code', { email })
}

/**
 * 이메일 인증 코드 검증. 성공 후 30분 내 가입해야 함.
 */
export async function verifyEmailCode(email, code) {
  await apiClient.post('/auth/email/verify-code', { email, code })
}

/**
 * 로그아웃 — RT 쿠키 만료 + AT 제거.
 * 서버 호출 실패해도 클라이언트 상태는 정리한다.
 */
export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    removeAccessToken()
  }
}

/**
 * 명시적 AT 재발급. 평소엔 client.js 의 401 인터셉터가 자동 호출하므로
 * 직접 부를 일은 거의 없음. 디버깅·앱 부팅 시 활용.
 */
export async function refresh() {
  const accessToken = await apiClient.post('/auth/refresh')
  setAccessToken(accessToken)
  return accessToken
}
