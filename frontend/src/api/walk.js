/**
 * 산책 위험도 API — BE WalkController (/api/walk) 매핑.
 *
 * 인증 필요 (client.js 가 AT 자동 첨부).
 * 응답 DTO 는 backend/.../walk/WalkScoreResponse 참고:
 *   { score:0~100, level:'안전'|'주의'|'위험',
 *     reasons:string[], reasonCodes:string[],          // reasons[i] ↔ reasonCodes[i] 1:1
 *     topReasons:string[], topReasonCodes:string[] }   // topReasons[i] ↔ topReasonCodes[i] 1:1
 * reasonCodes/topReasonCodes 는 룰 식별 코드(GROUND_TEMP_SEVERE 등) — 문구 대신 코드로
 * 카테고리·아이콘 매핑할 때 사용. constants/riskReasons.js 의 toDisplayReasons() 참고.
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

/**
 * 시간대별 산책 적합도 + 최적 시간 추천 조회. GET /api/walk/optimal-time?dogId=
 *
 * 응답 data (docs/06-api-spec.md `/api/walk/optimal-time` 계약, #76):
 *   { slots: SlotResult[], best: SlotResult[] }
 *   SlotResult = { time:'YYYY-MM-DDTHH:mm', score:0~100, level:'안전'|'주의'|'위험', topReasonCodes:string[] }
 * - slots: 단기예보 미래 슬롯 각 시각의 적합도 (FE 가 시간축 차트로 렌더)
 * - best : slots 중 점수 상위 1~3개 추천 (FE 가 강조)
 *
 * 주의: /score 와 동일하게 날씨 스냅샷이 비어 있으면 WEATHER_API_ERROR(503).
 *       → 호출부에서 notReady("준비 중") 처리. (useOptimalTime 참고)
 *
 * @param {number} dogId
 * @returns {Promise<{slots:Array, best:Array}>}
 */
export async function getOptimalTime(dogId) {
  return apiClient.get('/walk/optimal-time', { params: { dogId } })
}
