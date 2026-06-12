/**
 * 사용자 API — BE UserController (/api/users) 매핑.
 *
 * BE PR #34 짝꿍. 인증 필요 (client.js 가 AT 자동 첨부).
 *
 * UserResponse 필드 (backend/.../user/dto/UserResponse.java):
 *   { userId, email, nickname, profileImageUrl, role, createdAt, updatedAt }
 */
import apiClient from './client'
import { removeAccessToken } from './tokenStorage'

/** 내 정보 조회. @returns {Promise<UserResponse>} */
export async function getMe() {
  return apiClient.get('/users/me')
}

/**
 * 내 정보 수정 (PATCH — null 인 필드는 변경 안 함).
 * @param {{nickname?: string, profileImageUrl?: string}} payload
 * @returns {Promise<UserResponse>}
 */
export async function updateMe(payload) {
  return apiClient.patch('/users/me', payload)
}

/**
 * 회원 탈퇴 (soft delete + RT 무효화).
 * 성공 시 로컬 AT 도 정리. BE 에서 204 반환.
 */
export async function deleteMe() {
  await apiClient.delete('/users/me')
  removeAccessToken()
}

/**
 * 비밀번호 변경
 * @param {{
 *  currentPassword: string,
 *  newPassword: string
 * }} payload
 */
export async function changePassword(payload) {
  return apiClient.patch('/users/password', payload)
}