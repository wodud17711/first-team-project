/**
 * [개발 전용 미리보기] 최적 산책시간 차트 골격 검증용 페이지.
 * ============================================================================
 * 라우트: /dev/optimal-time (공개 — 로그인 불필요, mock 동작)
 *
 * 목적
 * - BE(#71 optimal-time) 머지 전에 OptimalTimeChart / useOptimalTime / mock 골격을 눈으로 확인.
 * - 정선혜가 실제 산책 화면(/walk)에 배치할 때 참고용. 배치되면 이 dev 라우트는 제거 가능.
 *
 * ⚠️ 프로덕션 화면 아님. App.jsx 의 공개 라우트에 임시로 달려 있음.
 */
import { useState } from 'react'
import OptimalTimeChart from '../../components/OptimalTimeChart'
import { useOptimalTime } from '../../hooks/useOptimalTime'

const STATES = [
  { key: 'normal', label: '정상(mock)' },
  { key: 'loading', label: '로딩' },
  { key: 'notReady', label: '날씨 준비중' },
  { key: 'noDog', label: '반려견 없음' },
]

export default function OptimalTimePreview() {
  const [state, setState] = useState('normal')
  // dogId 는 mock 모드라 값만 있으면 됨(실호출 X).
  const { data, loading, notReady } = useOptimalTime(1)

  // 상태 토글에 따라 차트 props 를 강제(골격 검증용).
  const props =
    state === 'loading' ? { loading: true }
      : state === 'notReady' ? { notReady: true }
        : state === 'noDog' ? { hasDog: false }
          : { slots: data?.slots, best: data?.best, loading, notReady }

  return (
    <div className="min-h-screen bg-brand-50 p-6">
      <div className="max-w-[720px] mx-auto">
        <h1 className="text-[20px] font-bold text-txtcolor-900 mb-1">
          최적 산책시간 차트 — 미리보기 <span className="text-[13px] text-txtcolor-400">(dev · mock)</span>
        </h1>
        <p className="text-[13px] text-txtcolor-500 mb-4">
          #76 계약(slots/best) 기반 골격. BE 머지 후 useOptimalTime 의 USE_MOCK=false 로 실데이터 전환.
        </p>

        {/* 상태 토글 */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => setState(s.key)}
              className={`px-3 py-1 rounded-full text-[13px] font-bold border transition
                ${state === s.key
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-txtcolor-500 border-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <OptimalTimeChart {...props} />
      </div>
    </div>
  )
}
