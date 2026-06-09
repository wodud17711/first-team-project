/**
 * 최적 산책시간 mock 데이터 (#76 계약 / docs/06-api-spec.md `/api/walk/optimal-time`)
 * ============================================================================
 * BE(#71 윤소윤) 머지 전까지 FE 차트 골격을 선작업하기 위한 가짜 응답.
 * 형태는 실제 응답 `data` 와 동일: { slots: SlotResult[], best: SlotResult[] }
 *   SlotResult = { time:"YYYY-MM-DDTHH:mm", score:0~100, level:'안전'|'주의'|'위험', topReasonCodes:string[] }
 *
 * 값은 부산 6월 한낮 패턴 근사(아침 안전 → 정오~오후 지면온도/더위로 위험 → 저녁 회복).
 * BE 머지되면 useOptimalTime 의 USE_MOCK=false 로 바꾸면 이 파일은 더 이상 쓰이지 않는다.
 * topReasonCodes 는 constants/riskReasons.js 의 코드와 동일 어휘를 사용(차트 강조/툴팁용).
 */

/** @typedef {{ time:string, score:number, level:string, topReasonCodes:string[] }} SlotResult */

/** @type {{ slots: SlotResult[], best: SlotResult[] }} */
export const OPTIMAL_TIME_MOCK = {
  slots: [
    { time: '2026-06-09T08:00', score: 88, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T09:00', score: 84, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T10:00', score: 76, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T11:00', score: 64, level: '주의', topReasonCodes: ['FEELS_HOT'] },
    { time: '2026-06-09T12:00', score: 48, level: '주의', topReasonCodes: ['GROUND_TEMP_HIGH', 'FEELS_HOT'] },
    { time: '2026-06-09T13:00', score: 36, level: '위험', topReasonCodes: ['GROUND_TEMP_SEVERE', 'FEELS_HOT'] },
    { time: '2026-06-09T14:00', score: 32, level: '위험', topReasonCodes: ['GROUND_TEMP_SEVERE', 'FEELS_HOT', 'UV_VERY_HIGH'] },
    { time: '2026-06-09T15:00', score: 40, level: '위험', topReasonCodes: ['GROUND_TEMP_HIGH', 'UV_HIGH'] },
    { time: '2026-06-09T16:00', score: 54, level: '주의', topReasonCodes: ['FEELS_HOT'] },
    { time: '2026-06-09T17:00', score: 68, level: '주의', topReasonCodes: ['UV_HIGH'] },
    { time: '2026-06-09T18:00', score: 80, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T19:00', score: 86, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T20:00', score: 90, level: '안전', topReasonCodes: [] },
  ],
  // slots 중 점수 상위 3개 (BE 가 동일 규칙으로 내려줄 예정).
  best: [
    { time: '2026-06-09T20:00', score: 90, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T08:00', score: 88, level: '안전', topReasonCodes: [] },
    { time: '2026-06-09T19:00', score: 86, level: '안전', topReasonCodes: [] },
  ],
}

export default OPTIMAL_TIME_MOCK
