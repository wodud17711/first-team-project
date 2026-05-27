/**
 * 반려견 API — BE DogController (/api/dogs) 매핑.
 *
 * 모두 인증 필요 (client.js 가 AT 자동 첨부).
 * 응답 DTO 는 backend/.../dog/dto/DogResponse 참고:
 *   { id, name, breed:{id,nameKr,...}, birthDate, ageYears, weight,
 *     gender:'M'|'F', isNeutered, activityLevel:'저'|'중'|'고', healthNotes, profileImageUrl, createdAt }
 */
import apiClient from './client'

/** 내 반려견 목록. @returns {Promise<DogResponse[]>} */
export async function listDogs() {
  return apiClient.get('/dogs')
}

/** 단건 조회. @returns {Promise<DogResponse>} */
export async function getDog(dogId) {
  return apiClient.get(`/dogs/${dogId}`)
}

/**
 * 반려견 등록.
 * @param {object} payload
 *   - name (필수), breedId (선택, 믹스/미확정이면 null),
 *     birthDate ('YYYY-MM-DD'), weight (kg),
 *     gender ('M'|'F'), isNeutered (boolean),
 *     activityLevel ('저'|'중'|'고'), healthNotes, profileImageUrl
 * @returns {Promise<DogResponse>}
 */
export async function createDog(payload) {
  return apiClient.post('/dogs', payload)
}

/** 부분 수정 (PATCH 의미 — null 인 필드는 변경 안 함). */
export async function updateDog(dogId, payload) {
  return apiClient.patch(`/dogs/${dogId}`, payload)
}

/** 소프트 삭제 (BE 에서 deletedAt 만 set). 204 No Content. */
export async function deleteDog(dogId) {
  return apiClient.delete(`/dogs/${dogId}`)
}
