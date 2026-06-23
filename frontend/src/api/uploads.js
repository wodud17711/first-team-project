/**
 * 이미지 업로드 API — BE UploadController (POST /api/uploads, 공용).
 *
 * multipart 필드명은 `file` 고정, 인증 필요(apiClient 가 Bearer 자동 첨부).
 * 성공 시 ApiResponse.data = { url } 을 apiClient 가 까서 반환하므로 `res.url` 이 저장 URL.
 * 저장 파일은 BE 에서 `/uploads/**` 정적 서빙(WebConfig).
 * 정본: docs/06-api-spec.md "이미지 업로드"(v3.7).
 */
import apiClient from './client'

// BE 제한과 동일 (5MB, jpg/png)
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

/**
 * 업로드 전 클라이언트 1차 검증. 통과하면 null, 아니면 사용자용 메시지 문자열.
 * @param {File} file
 * @returns {string|null}
 */
export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'jpg 또는 png 이미지만 올릴 수 있어요.'
  if (file.size > MAX_IMAGE_BYTES) return '이미지는 5MB 이하만 올릴 수 있어요.'
  return null
}

/**
 * 이미지 단건 업로드 → 저장 URL 반환.
 * @param {File} file
 * @returns {Promise<string>} 저장된 이미지 URL
 */
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)

  // 기본 'application/json' 헤더를 비워 axios/브라우저가 multipart 경계를 자동 설정하게 한다.
  const res = await apiClient.post('/uploads', form, {
    headers: { 'Content-Type': undefined },
  })

  return res.url
}
