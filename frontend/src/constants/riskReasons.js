/**
 * 위험사유 매핑 (룰 코드 → 카테고리·심각도·아이콘키)
 * ====================================================
 * BE /api/walk/score 응답의 reasonCodes / topReasonCodes(룰베이스 walk_risk.py 의
 * 룰 식별 코드)를 화면 표시용 메타로 변환한다.
 *
 * 설계 의도
 * - 사유 "문구"(reasons[i])는 룰베이스가 이미 한글 문장으로 내려준다. 문구는 자주
 *   바뀌므로 매핑 키로 쓰지 않고, 안정적인 "코드"(reasonCodes[i])로 카테고리·아이콘을 건다.
 * - 이 모듈은 의미 매핑(카테고리/심각도/아이콘키)만 제공한다. 실제 아이콘 에셋·색·레이아웃은
 *   디자인(정선혜) 영역 — iconKey 라는 안정적인 문자열만 넘기고 매핑은 카드 쪽에서 한다.
 *
 * severity: 룰 감점 크기에 따른 표시 가중치. 'high'(≥25) / 'medium'(15~24) / 'low'(<15).
 *           (실제 산책 등급(안전/주의/위험)은 BE level 정본을 따른다. 이건 개별 사유의 시각 강조용.)
 *
 * categoryLabel: 사유를 묶는 짧은 분류 라벨(예: '지면온도', '미세먼지'). 전체 문장이 아니라
 *                카테고리 칩/아이콘 옆 라벨로 쓰는 용도.
 *
 * 코드 출처: ai/rules/walk_risk.py RULES[].code (+ 사유 없음 ALL_CLEAR).
 */

export const RISK_SEVERITY = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low', NONE: 'none' }

/**
 * @typedef {Object} RiskReasonMeta
 * @property {string} category      의미 카테고리 키 (ground|heat|humidity|cold|air|precip|temp|wind|uv|clear)
 * @property {string} categoryLabel 분류 라벨 (지면온도·더위·미세먼지 …)
 * @property {string} iconKey       디자인이 아이콘 에셋에 매핑할 안정 키
 * @property {string} severity      RISK_SEVERITY 값
 */

/** @type {Record<string, RiskReasonMeta>} */
export const RISK_REASON_MAP = {
  // ── 지면온도 (발바닥 화상) ──
  GROUND_TEMP_SEVERE: { category: 'ground', categoryLabel: '지면온도', iconKey: 'ground', severity: 'high' },
  GROUND_TEMP_HIGH:   { category: 'ground', categoryLabel: '지면온도', iconKey: 'ground', severity: 'medium' },

  // ── 더위/고온 ──
  FEELS_HOT:           { category: 'heat', categoryLabel: '더위', iconKey: 'heat', severity: 'medium' },
  BRACHY_HEAT:         { category: 'heat', categoryLabel: '더위', iconKey: 'heat', severity: 'high' },
  LOW_HEAT_TOLERANCE:  { category: 'heat', categoryLabel: '더위', iconKey: 'heat', severity: 'medium' },
  LONG_COAT_HEAT:      { category: 'heat', categoryLabel: '더위', iconKey: 'heat', severity: 'low' },
  SENIOR_HEAT:         { category: 'heat', categoryLabel: '더위', iconKey: 'heat', severity: 'medium' },

  // ── 습도 (열사병) ──
  HUMID_HEAT: { category: 'humidity', categoryLabel: '습도', iconKey: 'humidity', severity: 'low' },

  // ── 추위/저온 ──
  FEELS_COLD:         { category: 'cold', categoryLabel: '추위', iconKey: 'cold', severity: 'medium' },
  LOW_COLD_TOLERANCE: { category: 'cold', categoryLabel: '추위', iconKey: 'cold', severity: 'medium' },
  SMALL_SHORT_COLD:   { category: 'cold', categoryLabel: '추위', iconKey: 'cold', severity: 'low' },
  SENIOR_COLD:        { category: 'cold', categoryLabel: '추위', iconKey: 'cold', severity: 'medium' },

  // ── 미세먼지 ──
  PM_VERY_BAD:    { category: 'air', categoryLabel: '미세먼지', iconKey: 'air', severity: 'high' },
  PM_BAD:         { category: 'air', categoryLabel: '미세먼지', iconKey: 'air', severity: 'medium' },
  SENIOR_BAD_AIR: { category: 'air', categoryLabel: '미세먼지', iconKey: 'air', severity: 'low' },

  // ── 강수 ──
  SNOW: { category: 'precip', categoryLabel: '강수', iconKey: 'snow', severity: 'medium' },
  RAIN: { category: 'precip', categoryLabel: '강수', iconKey: 'rain', severity: 'low' },

  // ── 기온 (퍼피 더위/추위 양쪽 — 코드만으로 방향 구분 불가) ──
  PUPPY_EXTREME: { category: 'temp', categoryLabel: '기온', iconKey: 'temp', severity: 'low' },

  // ── 강풍 ──
  STRONG_WIND: { category: 'wind', categoryLabel: '바람', iconKey: 'wind', severity: 'low' },

  // ── 자외선 ──
  UV_VERY_HIGH: { category: 'uv', categoryLabel: '자외선', iconKey: 'uv', severity: 'medium' },
  UV_HIGH:      { category: 'uv', categoryLabel: '자외선', iconKey: 'uv', severity: 'low' },

  // ── 사유 없음 (100점) ──
  ALL_CLEAR: { category: 'clear', categoryLabel: '양호', iconKey: 'clear', severity: 'none' },
}

/** 알 수 없는 코드(룰 추가 후 FE 미반영 등)용 안전 폴백. */
export const UNKNOWN_RISK_REASON = {
  category: 'etc', categoryLabel: '기타', iconKey: 'info', severity: 'low',
}

/**
 * 룰 코드 하나를 표시 메타로 변환. 매핑에 없으면 폴백 반환(앱이 깨지지 않게).
 * @param {string} code
 * @returns {RiskReasonMeta}
 */
export function resolveRiskReason(code) {
  return RISK_REASON_MAP[code] ?? UNKNOWN_RISK_REASON
}

/**
 * 코드 배열 + 문구 배열을 카드 표시용 객체 배열로 결합(zip).
 * BE 응답의 reasonCodes/topReasonCodes 와 reasons/topReasons 를 그대로 넘기면 된다.
 * 길이가 어긋나거나 codes 가 없을 때도 문구는 살리고 메타는 폴백으로 채운다.
 *
 * @param {string[]} [codes=[]]    reasonCodes 또는 topReasonCodes
 * @param {string[]} [messages=[]] reasons 또는 topReasons (그대로 보여줄 한글 문장)
 * @returns {Array<{code: string|null, message: string} & RiskReasonMeta>}
 */
export function toDisplayReasons(codes = [], messages = []) {
  const len = Math.max(codes.length, messages.length)
  const out = []
  for (let i = 0; i < len; i++) {
    const code = codes[i] ?? null
    out.push({
      code,
      message: messages[i] ?? '',
      ...(code ? resolveRiskReason(code) : UNKNOWN_RISK_REASON),
    })
  }
  return out
}
