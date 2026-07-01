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

/**
 * 산책 시작. POST /api/walks/start
 * 미종료 산책이 있으면 BE가 WALK_ALREADY_IN_PROGRESS(409) 반환.
 * @param {number} dogId
 * @returns {Promise<{walkId:number, dogId:number, startTime:string}>}
 */
export async function startWalk(dogId) {
  return apiClient.post('/walks/start', { dogId })
}

/**
 * 산책 종료. POST /api/walks/{walkId}/end
 * durationMinutes 는 BE 가 startTime~endTime 으로 자동 계산(웹 = GPS 없는 수동 기록).
 * userFeedback 은 docs/11 수집 컨벤션(JSON 문자열 {"thermal":"HOT|OK|COLD",...})으로 보내면
 * 룰베이스 v2 피드백 수집과 연결된다.
 * @param {number} walkId
 * @param {{distanceKm?: number|null, memo?: string|null, userFeedback?: string|null}} body
 * @returns {Promise<object>} WalkResponse
 */
export async function endWalk(walkId, body) {
  return apiClient.post(`/walks/${walkId}/end`, body)
}

/**
 * 반려견별 산책 이력 (최신순). GET /api/walks/history?dogId=
 * @param {number} dogId
 * @returns {Promise<Array<object>>} WalkResponse[]
 */
export async function getWalkHistory(dogId) {
  return apiClient.get('/walks/history', { params: { dogId } })
}

/**
 * 산책 기록 삭제. DELETE /api/walks/{walkId}
 * 소유자만 가능(위반 403 / 없으면 404). 연결된 점수·위치는 BE 에서 함께 정리된다.
 * @param {number} walkId
 * @returns {Promise<null>}
 */
export async function deleteWalk(walkId) {
  return apiClient.delete(`/walks/${walkId}`)
}

/**
 * 산책 통계 (주/월). GET /api/walks/statistics?dogId=&period=
 *
 * 응답 (docs/06-api-spec.md 산책 통계):
 *   { period, totalWalks, totalMinutes, totalDistance, avgDuration, achievementRate,
 *     dailyBreakdown: [{date, minutes, count}],
 *     previous: {totalWalks, totalMinutes, totalDistance, avgDuration, achievementRate} }
 * - previous = 직전 동일 구간(지난주/지난달) → FE 가 "지난주 대비" 델타 계산 (현재 − previous)
 * - dailyBreakdown = 구간 내 모든 날짜(산책 없는 날 0) → 요일별 집계·막대용
 *
 * @param {number} dogId
 * @param {'WEEK'|'MONTH'} period
 */
export async function getWalkStatistics(dogId, period = 'WEEK') {
  return apiClient.get('/walks/statistics', { params: { dogId, period } })
}

/**
 * 산책 캘린더 (월별 히트맵 입력). GET /api/walks/calendar?dogId=&year=&month=
 * 응답: { year, month, days: [{date, count, minutes}] }
 * @param {number} dogId
 * @param {number} year
 * @param {number} month  1~12
 */
export async function getWalkCalendar(dogId, year, month) {
  return apiClient.get('/walks/calendar', { params: { dogId, year, month } })
}
