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
import WalkPathMap from '../components/WalkPathMap'
import { subjectName } from '../lib/korean'
import dogImgFallback from '../assets/dogImg1.jpg'

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
  const [pickedIds, setPickedIds] = useState(null) // 사용자가 고른 산책 대상(복수)

  const { sessions, isActive, activeDogIds, elapsedSec, busy, error, start, finish, clearLocal } =
    useWalkRecord()

  // 산책 대상(복수): 진행 중이면 산책 중인 강아지들로 잠금, 아니면 고른 것(없으면 대표 1마리).
  const mainDogId = (dogs.find((d) => d.isMain) ?? dogs[0])?.dogId ?? null
  const defaultIds = mainDogId != null ? [mainDogId] : []
  const selectedIds = isActive ? activeDogIds : (pickedIds ?? defaultIds)
  const selectedDogs = dogs.filter((d) => selectedIds.includes(d.dogId))
  const dog = dogs.find((d) => d.dogId === selectedIds[0]) ?? dogs[0] // 표시·이력 기준(첫 선택)
  const namesLabel =
    selectedDogs.map((d) => subjectName(d.name)).join(', ') || subjectName(dog?.name) || ''

  const toggleDog = (id) =>
    setPickedIds((prev) => {
      const base = prev ?? defaultIds
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    })

  const { walks, loading: histLoading, refetch } = useWalkHistory(dog?.dogId ?? null)

  // 종료 폼 입력 상태
  const [showEndForm, setShowEndForm] = useState(false)
  const [frozenSec, setFrozenSec] = useState(0) // '산책 종료' 누른 순간 경과시간 고정(폼에서 타이머 멈춤)
  const [distanceKm, setDistanceKm] = useState('')
  const [thermal, setThermal] = useState(null)
  const [memo, setMemo] = useState('')

  const handleStart = async () => {
    if (selectedIds.length === 0) return
    try {
      await start(selectedIds)
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
        {namesLabel}와의 산책을 기록하고 체감을 남겨보세요.
      </p>

      {/* 산책 대상 반려견 선택 (여러 마리일 때만, 동시 산책 = 복수 선택). 진행 중이면 잠금. */}
      {dogs.length > 1 && (
        <div className="mb-4">
          <p className="text-[13px] text-gray-500 mb-1">
            산책할 반려견 <span className="text-gray-400">(여러 마리 함께 선택 가능)</span>
          </p>
          {isActive ? (
            <div className="flex flex-wrap gap-2">
              {selectedDogs.map((d) => (
                <div
                  key={d.dogId}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 border border-sky-300 text-[13px] font-semibold text-sky-800"
                >
                  <img src={d.profileImageUrl || dogImgFallback} alt="" className="w-5 h-5 rounded-full object-cover" />
                  {d.name} · 산책 중
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dogs.map((d) => {
                const on = selectedIds.includes(d.dogId)
                return (
                  <button
                    key={d.dogId}
                    onClick={() => toggleDog(d.dogId)}
                    aria-pressed={on}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] transition ${
                      on
                        ? 'bg-sky-100 border-sky-400 text-sky-800 font-semibold'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <img src={d.profileImageUrl || dogImgFallback} alt="" className="w-5 h-5 rounded-full object-cover" />
                    {d.name}
                    {on && <span className="text-sky-500">✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

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
        {!isActive ? (
          // idle: 시작
          <>
            <p className="text-[14px] text-gray-500 mb-4">지금 {namesLabel}와 산책을 시작할까요?</p>
            <button
              onClick={handleStart}
              disabled={busy || selectedIds.length === 0}
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
              onClick={() => {
                setFrozenSec(elapsedSec) // 종료 누른 순간 시간 고정
                setShowEndForm(true)
              }}
              className="px-8 py-3 rounded-full bg-orange-500 text-white text-[16px] font-bold"
            >
              ■ 산책 종료
            </button>
          </>
        ) : (
          // 종료 폼: 거리 · 체감 · 메모
          <div className="text-left">
            <p className="text-[16px] font-bold text-gray-800 mb-4 text-center">
              산책 종료 · {formatElapsed(frozenSec)}
            </p>

            {/* 걸은 경로를 지도에 찍으면 거리 자동 계산 → 아래 input 에 반영(수동 보정 가능) */}
            <label className="block text-[13px] text-gray-500 mb-1">걸은 경로 (지도 클릭)</label>
            <div className="mb-3">
              <WalkPathMap
                height={220}
                onDistanceChange={(km) => setDistanceKm(km ? String(km) : '')}
              />
            </div>

            <label className="block text-[13px] text-gray-500 mb-1">거리 (km) · 자동계산, 수정 가능</label>
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
