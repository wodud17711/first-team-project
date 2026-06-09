/**
 * 최적 산책시간 차트 (시간대별 산책 적합도 + 추천)
 * ============================================================================
 * BE GET /api/walk/optimal-time (#76 계약) 의 slots[]/best[] 를 시간축 막대차트로 렌더.
 * 현재는 useOptimalTime 이 mock 으로 공급(BE #71 머지 전). 데이터 형태는 실응답과 동일.
 *
 * 설계 메모(PM 임재영 골격):
 * - 등급(안전/주의/위험)은 BE level 정본을 그대로 색에 매핑(점수 임계 재계산 X — override 반영).
 * - 추천 토글(전체·지금·오후)은 클라이언트 뷰 필터다. '전체'는 BE best 정본을 쓰고,
 *   '지금'/'오후'는 slots 를 시간대로 거른 뒤 점수 상위로 다시 뽑는다(어느 쪽이든 BE 점수는 그대로).
 * - 추천 슬롯은 막대 강조(ring) + 상단 ★. 막대 클릭 시 해당 시각 사유 상세를 아래에 펼친다.
 * - 색/문구/간격 최종 비주얼은 디자인(정선혜) 영역 — 여기선 안정적인 토큰만 사용.
 * - WalkScore.jsx 와 동일한 상태 우선순위(반려견 없음 → 로딩 → 준비중 → 오류 → 정상)를 따른다.
 */

import { useMemo, useState } from 'react'
import { toDisplayReasons } from '../constants/riskReasons'

// 등급 → 표시 토큰 (WalkScore 와 동일 어휘: success/warning/danger)
const LEVEL_STYLE = {
  '안전': { bar: 'bg-success', text: 'text-success', dot: 'bg-success' },
  '주의': { bar: 'bg-warning', text: 'text-warning', dot: 'bg-warning' },
  '위험': { bar: 'bg-danger', text: 'text-danger', dot: 'bg-danger' },
}
const FALLBACK_STYLE = { bar: 'bg-gray-300', text: 'text-gray-400', dot: 'bg-gray-300' }

const styleOf = (level) => LEVEL_STYLE[level] ?? FALLBACK_STYLE

// "2026-06-09T20:00" → 20 (시). 파싱 실패 시 null.
function hourOf(time) {
  const m = /T(\d{2}):/.exec(time ?? '')
  return m ? parseInt(m[1], 10) : null
}
const hourLabel = (time) => {
  const h = hourOf(time)
  return h == null ? '--' : `${h}시`
}

// 추천 토글 정의. predicate(hour, nowHour) 로 슬롯을 거른다.
const REC_MODES = [
  { key: 'all', label: '전체' },
  { key: 'now', label: '지금', predicate: (h, now) => h >= now },
  { key: 'afternoon', label: '오후', predicate: (h) => h >= 12 && h < 18 },
]

// 상태 안내 카드 (반려견 없음/로딩/준비중/오류/빈 데이터 공용)
function StateCard({ title, desc }) {
  return (
    <div className="bg-white rounded-xl px-5 py-8 shadow-sm w-full text-center">
      <p className="text-[16px] font-bold text-txtcolor-900">{title}</p>
      <p className="text-[13px] text-txtcolor-500 mt-1">{desc}</p>
    </div>
  )
}

/**
 * @param {Object} props
 * @param {Array<{time:string,score:number,level:string,topReasonCodes:string[]}>} [props.slots]
 * @param {Array<{time:string,score:number,level:string}>} [props.best]  BE 정본 추천(전체 모드용)
 * @param {boolean} [props.loading]
 * @param {boolean} [props.notReady]  날씨 스냅샷 미집계(WEATHER_API_ERROR) → "준비 중"
 * @param {boolean} [props.hasDog]
 */
function OptimalTimeChart({
  slots,
  best = [],
  loading = false,
  notReady = false,
  hasDog = true,
}) {
  const [mode, setMode] = useState('all')
  // 클릭한 슬롯 시각(상세 펼침). null 이면 닫힘.
  const [selectedTime, setSelectedTime] = useState(null)

  const hasSlots = Array.isArray(slots) && slots.length > 0

  // 현재 시각(시). "지금" 필터 기준. 브라우저 로컬 기준이라 mock/실데이터 모두 동작.
  const nowHour = useMemo(() => new Date().getHours(), [])

  // 활성 모드의 추천 슬롯(점수 상위 3). '전체'는 BE best 정본 우선.
  const recommended = useMemo(() => {
    if (!hasSlots) return []
    if (mode === 'all') {
      if (best.length > 0) return best.slice(0, 3)
      return [...slots].sort((a, b) => b.score - a.score).slice(0, 3)
    }
    const { predicate } = REC_MODES.find((m) => m.key === mode)
    return slots
      .filter((s) => {
        const h = hourOf(s.time)
        return h != null && predicate(h, nowHour)
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [mode, slots, best, hasSlots, nowHour])

  // 표시 상태 결정 (WalkScore 와 동일 우선순위)
  if (!hasDog) {
    return <StateCard title="반려견을 먼저 등록해 주세요" desc="등록하면 시간대별 추천 산책 시간을 알려드려요" />
  }
  if (loading) {
    return <StateCard title="추천 시간을 계산하고 있어요" desc="잠시만 기다려 주세요" />
  }
  if (notReady) {
    return <StateCard title="날씨 데이터를 준비하고 있어요 🛰️" desc="예보가 모이면 시간대별 추천을 보여드려요" />
  }
  if (!hasSlots) {
    return <StateCard title="추천 시간을 불러오지 못했어요" desc="잠시 후 다시 시도해 주세요" />
  }

  const recTimes = new Set(recommended.map((b) => b.time))
  const topPick = recommended[0] // 활성 모드의 1위
  const selected = selectedTime ? slots.find((s) => s.time === selectedTime) : null
  const selectedReasons = selected ? toDisplayReasons(selected.topReasonCodes, []) : []

  return (
    <div className="bg-white rounded-xl px-5 py-4 shadow-sm w-full">
      {/* 제목 + 추천 요약 */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <span className="
          inline-flex items-center justify-center
          px-3 py-1 rounded-full
          text-[13px] font-bold text-brand-700 bg-brand-100
        ">
          시간대별 산책 적합도
        </span>

        {topPick ? (
          <span className="text-[13px] text-txtcolor-500">
            추천 산책 시간{' '}
            <b className="text-txtcolor-900">{hourLabel(topPick.time)}</b>
            <span className={`ml-1 font-bold ${styleOf(topPick.level).text}`}>
              {topPick.score}점
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-txtcolor-400">이 시간대엔 추천할 슬롯이 없어요</span>
        )}
      </div>

      {/* 추천 토글 (전체 / 지금 / 오후) */}
      <div className="inline-flex rounded-full bg-gray-100 p-0.5 mb-2">
        {REC_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1 rounded-full text-[12px] font-bold transition
              ${mode === m.key ? 'bg-white text-brand-700 shadow-sm' : 'text-txtcolor-500'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="mt-2 flex items-end gap-1.5 h-[160px]">
        {slots.map((s) => {
          const st = styleOf(s.level)
          const isRec = recTimes.has(s.time)
          const isSel = s.time === selectedTime
          const h = Math.max(0, Math.min(s.score, 100))
          const reasonLabels = toDisplayReasons(s.topReasonCodes, [])
            .map((r) => r.categoryLabel)
            .join('·')
          const tip = `${hourLabel(s.time)} · ${s.score}점 · ${s.level}${reasonLabels ? ` (${reasonLabels})` : ''}`

          return (
            <button
              key={s.time}
              type="button"
              onClick={() => setSelectedTime(isSel ? null : s.time)}
              className="flex-1 flex flex-col items-center justify-end h-full focus:outline-none"
              title={tip}
              aria-pressed={isSel}
            >
              {/* 점수 + 추천 ★ */}
              <div className="flex flex-col items-center mb-1 leading-none">
                {isRec && <span className="text-[11px]">⭐</span>}
                <span className="text-[10px] text-txtcolor-500">{s.score}</span>
              </div>

              {/* 막대 */}
              <div className="w-full flex items-end justify-center" style={{ height: `${h}%` }}>
                <div
                  className={`
                    w-full max-w-[26px] rounded-t-md transition-all duration-300
                    ${st.bar}
                    ${isRec ? 'ring-2 ring-offset-1 ring-brand-400' : ''}
                    ${isSel ? 'ring-2 ring-offset-1 ring-txtcolor-700' : ''}
                  `}
                  style={{ height: '100%' }}
                />
              </div>

              {/* 시각 라벨 */}
              <span className={`mt-1.5 text-[10px] whitespace-nowrap
                ${isSel ? 'text-txtcolor-900 font-bold' : 'text-txtcolor-500'}`}>
                {hourLabel(s.time)}
              </span>
            </button>
          )
        })}
      </div>

      {/* 선택 슬롯 상세 (막대 클릭 시) */}
      {selected && (
        <div className="mt-3 rounded-lg bg-brand-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${styleOf(selected.level).dot}`} />
            <b className="text-[14px] text-txtcolor-900">{hourLabel(selected.time)}</b>
            <span className={`text-[13px] font-bold ${styleOf(selected.level).text}`}>
              {selected.score}점 · {selected.level}
            </span>
          </div>
          {selectedReasons.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedReasons.map((r, i) => (
                <span
                  key={`${r.code ?? 'x'}-${i}`}
                  className="px-2 py-0.5 rounded-full text-[12px] bg-white text-txtcolor-700 border border-gray-200"
                >
                  {r.categoryLabel}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-txtcolor-500">감점 사유 없이 산책하기 좋은 시간이에요 🐾</p>
          )}
        </div>
      )}

      {/* 범례 + 추천 칩 */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100 pt-3">
        {/* 등급 범례 */}
        <div className="flex items-center gap-3">
          {['안전', '주의', '위험'].map((lv) => (
            <span key={lv} className="flex items-center gap-1 text-[12px] text-txtcolor-500">
              <span className={`w-2.5 h-2.5 rounded-full ${styleOf(lv).dot}`} />
              {lv}
            </span>
          ))}
        </div>

        {/* 활성 모드 추천 칩 */}
        {recommended.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] text-txtcolor-500">추천</span>
            {recommended.map((b) => (
              <span
                key={b.time}
                className="px-2 py-0.5 rounded-full text-[12px] font-bold text-brand-700 bg-brand-100"
              >
                {hourLabel(b.time)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimalTimeChart
