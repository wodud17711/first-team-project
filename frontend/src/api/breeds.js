/**
 * 견종 API — BE DogBreedController (/api/breeds) 매핑.
 *
 * 인증 불필요 (SecurityConfig 에서 permitAll). 반려견 등록 폼의 드롭다운·검색에 사용.
 *
 * BreedSummary (목록):  { id, nameKr, nameEn, size, coatType, isBrachycephalic }
 * BreedResponse (단건): + avgWeightMin/Max, avgLifespan, heat/cold_tolerance, requiredActivity
 */
import apiClient from './client'

/**
 * 견종 검색. keyword 가 없으면 전체 (페이징 추가 가능).
 * @param {string} [keyword] — name_kr 부분일치
 * @returns {Promise<BreedSummary[]>}
 */
export async function searchBreeds(keyword) {
  return apiClient.get('/breeds', { params: keyword ? { keyword } : {} })
}

/** 단건 견종 상세. @returns {Promise<BreedResponse>} */
export async function getBreed(breedId) {
  return apiClient.get(`/breeds/${breedId}`)
}
