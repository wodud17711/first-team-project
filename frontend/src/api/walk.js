/**
 * 산책 위험도 API — BE WalkController (/api/walk) 매핑.
 *
 * 인증 필요 (client.js 가 AT 자동 첨부).
 * 응답 DTO 는 backend/.../walk/WalkScoreResponse 참고:
 *   { score:0~100, level:'안전'|'주의'|'위험', reasons:string[], topReasons:string[] }
 *
 * 주의: 날씨 스냅샷(weather_snapshots)이 비어 있으면 BE 가
 *       WEATHER_API_ERROR(503) 를 반환한다 (날씨 집계 배선 전까지). → 호출부에서 "준비 중" 처리.
 */
import apiClient from './client'

/**
 * 산책 위험도 점수 조회. GET /api/walk/score?dogId=
 * @param {number} dogId
 * @returns {Promise<{score:number, level:string, reasons:string[], topReasons:string[]}>}
 */
export async function getWalkScore(dogId) {
  return apiClient.get('/walk/score', { params: { dogId } })
}
