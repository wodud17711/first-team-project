// 산책 기록 화면 (웹 = GPS 없는 타이머+수동 기록)
// ─────────────────────────────────────────────────────────────
// ⚠️ 스캐폴딩(임재영): 로직·배선·구조 골격입니다. 색/간격/타이포 등 비주얼은
//    정선혜 영역 — 아래 className 은 기존 sky 톤 placeholder 이니 디자인에 맞게 교체하세요.
// 흐름: 대표 반려견 → "산책 시작" → 타이머 → "산책 종료"(거리·체감·메모) → 이력.
// 체감(thermal)은 docs/11 수집 컨벤션으로 저장돼 룰베이스 v2 데이터가 됩니다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDogs } from '../hooks/useDogs'
import {
  useWalkRecord,
  useWalkHistory,
  formatElapsed,
  parseThermal,
} from '../hooks/useWalkRecord'

// 체감 옵션 (docs/11 §1.2: HOT/OK/COLD). 라벨·이모지는 비주얼이라 정선혜가 조정 가능.
const THERMAL_OPTIONS = [
  { code: 'HOT', label: '더웠어요', emoji: '🥵' },
  { code: 'OK', label: '적당했어요', emoji: '🙂' },
  { code: 'COLD', label: '추웠어요', emoji: '🥶' },
]
const THERMAL_LABEL = { HOT: '더웠어요', OK: '적당했어요', COLD: '추웠어요' }

function WalkRecord() {
  const navigate = useNavigate()
  const { dogs, loading: dogsLoading } = useDogs()
  const dog = dogs[0] // 대표 반려견 (Home 과 동일 규칙)
  const dogId = dog?.dogId ?? null

  const { active, elapsedSec, busy, error, start, finish, clearLocal } = useWalkRecord()
  const { walks, loading: histLoading, refetch } = useWalkHistory(dogId)

  // 종료 폼 입력 상태
  const [showEndForm, setShowEndForm] = useState(false)
  const [distanceKm, setDistanceKm] = useState('')
  const [thermal, setThermal] = useState(null)
  const [memo, setMemo] = useState('')

  const handleStart = async () => {
    try {
      await start(dogId)
    } catch {
      // BE WALK_ALREADY_IN_PROGRESS 등 — error 상태로 표시됨
    }
  }

  const handleFinish = async () => {
    try {
      await finish({ distanceKm, thermal, memo })
      setShowEndForm(false)
      setDistanceKm('')
      setThermal(null)
      setMemo('')
      refetch()
    } catch {
      /* error 상태로 표시 */
    }
  }

  // ── 반려견 없음/로딩 ──
  if (dogsLoading) {
    return <div className="p-4 text-gray-400">불러오는 중...</div>
  }
  if (!dog) {
    return (
      <div className="p-4 animate-fadeIn">
        <h1 className="text-[28px] font-extrabold text-sky-800 mb-3">🐾 산책 기록</h1>
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <div className="text-[40px]">🐶</div>
          <p className="text-[14px]">반려견을 먼저 등록하면 산책을 기록할 수 있어요.</p>
          <button
            onClick={() => navigate('/dog-profile-create')}
            className="mt-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-[14px]"
          >
            반려견 등록하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 animate-fadeIn">
      <h1 className="text-[28px] font-extrabold text-sky-800 mb-1">🐾 산책 기록</h1>
      <p className="text-[13px] text-gray-500 mb-4">
        {dog.name}와의 산책을 기록하고 체감을 남겨보세요.
      </p>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 text-[13px] text-red-600">
          {error?.message || '요청을 처리하지 못했어요.'}
          {error?.errorCode === 'WALK_ALREADY_IN_PROGRESS' && (
            <button onClick={clearLocal} className="ml-2 underline">
              진행 상태 초기화
            </button>
          )}
        </div>
      )}

      {/* ── 산책 세션 카드 ── */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 mb-6 text-center">
        {!active ? (
          // idle: 시작
          <>
            <p className="text-[14px] text-gray-500 mb-4">지금 {dog.name}와 산책을 시작할까요?</p>
            <button
              onClick={handleStart}
              disabled={busy}
              className="px-8 py-3 rounded-full bg-sky-600 text-white text-[16px] font-bold disabled:opacity-50"
            >
              ▶ 산책 시작
            </button>
          </>
        ) : !showEndForm ? (
          // active: 타이머 + 종료
          <>
            <p className="text-[13px] text-sky-700 mb-1">산책 중...</p>
            <div className="text-[44px] font-extrabold text-sky-800 tabular-nums mb-4">
              {formatElapsed(elapsedSec)}
            </div>
            <button
              onClick={() => setShowEndForm(true)}
              className="px-8 py-3 rounded-full bg-orange-500 text-white text-[16px] font-bold"
            >
              ■ 산책 종료
            </button>
          </>
        ) : (
          // 종료 폼: 거리 · 체감 · 메모
          <div className="text-left">
            <p className="text-[16px] font-bold text-gray-800 mb-4 text-center">
              산책 종료 · {formatElapsed(elapsedSec)}
            </p>

            <label className="block text-[13px] text-gray-500 mb-1">거리 (km, 선택)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="예: 1.5"
              className="w-full mb-4 px-3 py-2 rounded-lg border text-[14px]"
            />

            <label className="block text-[13px] text-gray-500 mb-1">오늘 산책 어땠나요? (체감)</label>
            <div className="flex gap-2 mb-4">
              {THERMAL_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setThermal(opt.code)}
                  className={`flex-1 py-2 rounded-lg border text-[13px] ${
                    thermal === opt.code ? 'bg-sky-100 border-sky-400 text-sky-800' : 'text-gray-500'
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>

            <label className="block text-[13px] text-gray-500 mb-1">메모 (선택)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="오늘 산책 한 줄 메모"
              className="w-full mb-4 px-3 py-2 rounded-lg border text-[14px]"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowEndForm(false)}
                className="flex-1 py-2 rounded-lg border text-[14px] text-gray-500"
              >
                취소
              </button>
              <button
                onClick={handleFinish}
                disabled={busy}
                className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-[14px] font-bold disabled:opacity-50"
              >
                기록 저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 산책 이력 ── */}
      <h2 className="text-[18px] font-bold text-sky-800 mb-3">최근 산책</h2>
      {histLoading ? (
        <div className="p-4 text-gray-400">불러오는 중...</div>
      ) : walks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
          <div className="text-[36px]">🐾</div>
          <p className="text-[14px]">아직 산책 기록이 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {walks.map((w) => {
            const th = parseThermal(w.userFeedback)
            return (
              <div key={w.walkId} className="rounded-xl border bg-white shadow-sm px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-gray-800">
                    {w.startTime ? w.startTime.slice(0, 10).replaceAll('-', '/') : '—'}
                  </span>
                  {th && (
                    <span className="text-[12px] px-2 py-[2px] rounded-full bg-sky-100 text-sky-700">
                      {THERMAL_LABEL[th]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-400">
                  <span>⏱ {w.durationMinutes != null ? `${w.durationMinutes}분` : '진행 중'}</span>
                  {w.distanceKm != null && <span>📏 {w.distanceKm}km</span>}
                  {w.memo && <span className="truncate">📝 {w.memo}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WalkRecord
