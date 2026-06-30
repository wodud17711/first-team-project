// 산책 기록 화면 (웹 = GPS 없는 타이머+수동 기록)
// ─────────────────────────────────────────────────────────────
// 흐름: 대표 반려견 → "산책 시작" → 타이머 → "산책 종료"(거리·체감·메모) → 이력.
// 체감(thermal)은 docs/11 수집 컨벤션으로 저장돼 룰베이스 v2 데이터가 됩니다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDogs } from '../../hooks/useDogs'
import { useWalkRecord, useWalkHistory, formatElapsed, parseThermal,} from '../../hooks/useWalkRecord'
import WalkPathMap from '../../components/WalkPathMap'
import { subjectName } from '../../lib/korean'
import { onImgError } from '../../utils/imageFallback'

// 체감 옵션 (docs/11 §1.2: HOT/OK/COLD).
const THERMAL_OPTIONS = [
  { code: 'HOT', label: '더웠어요', emoji: '🥵' },
  { code: 'OK', label: '딱 좋았어요', emoji: '🙂' },
  { code: 'COLD', label: '추웠어요', emoji: '🥶' },
]
const THERMAL_LABEL = { HOT: '🥵 더웠어요', OK: '🙂 딱 좋았어요', COLD: '🥶 추웠어요' }

function WalkRecord() {
  const navigate = useNavigate()
  const { dogs, loading: dogsLoading } = useDogs()
  const [pickedIds, setPickedIds] = useState(null) // 사용자가 고른 산책 대상(복수)

  const { sessions, isActive, activeDogIds, elapsedSec, busy, error, start, finish, clearLocal } =
    useWalkRecord()

  // 산책 대상(복수): 진행 중이면 산책 중인 강아지들로 잠금, 아니면 고른 것(없으면 대표 1마리).
  const selectedIds = isActive ? activeDogIds : (pickedIds ?? [])
  const selectedDogs = dogs.filter((d) => selectedIds.includes(d.dogId))
  const dog = dogs.find((d) => d.dogId === selectedIds[0]) ?? dogs[0] // 표시·이력 기준(첫 선택)
  const namesLabel =
    selectedDogs.map((d) => subjectName(d.name)).join(', ') || subjectName(dog?.name) || ''
  
  const hasMultipleDogs = dogs.length > 0
  const hasSelection = selectedIds.length > 0

  const questionText =
    hasMultipleDogs && !hasSelection
      ? '누구와 산책할까요?'
      : selectedDogs.length > 1
        ? `${namesLabel}와 함께 산책을 시작할까요?`
        : `${namesLabel}와 산책을 시작할까요?`

  // 여러 마리일 때, 대표 강아지가 젤 앞에 오게
  const sortedDogs = [...dogs].sort((a, b) => {
    return Number(b.isMain) - Number(a.isMain)
  })
  const orderedSelectedDogs = [...selectedDogs].sort(
    (a, b) => Number(b.isMain) - Number(a.isMain)
  )

  const toggleDog = (id) =>
    setPickedIds((prev) => {
      const base = prev ?? []
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    })

  const { walks, loading: histLoading, refetch } = useWalkHistory(dog?.dogId ?? null)

  // 타이머 아래 멘트
  const walkMessages = [
    '오늘도 즐거운 산책이에요 🐾',
    '반려견이 신나게 걷고 있어요 🐶',
    '천천히 주변을 둘러보세요 🌳',
    '좋은 추억이 쌓이고 있어요 💛',
    '건강한 하루를 만들고 있어요 🌞',
  ]

  // 최근 7개만 보여주기
  const visibleWalks = walks.slice(0, 7)

  // 기록 카드 내 거리별 배지
  const getDistanceBadge = (distanceKm) => {
    const distance = Number(distanceKm ?? 0)

    if (distance >= 8)
      return {
        label: '장거리 산책', emoji: '🥇', className: 'bg-purple-100 text-purple-700'}
    if (distance >= 3)
      return {
        label: '중거리 산책', emoji: '🥈', className: 'bg-brand-100 text-orange-700/90'}
    return {
      label: '단거리 산책', emoji: '🥉', className: 'bg-green-100/60 text-green-700'}
  }

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
    if (!distanceKm || Number(distanceKm) <= 0) {
      alert('총 산책 거리를 입력해주세요.')
      return
    }

    if (!thermal) {
      alert('오늘 산책 체감을 선택해주세요.')
      return
    }

    try {
      await finish({ distanceKm, thermal, memo })
      setShowEndForm(false)
      setDistanceKm('')
      setThermal(null)
      setMemo('')
      refetch()
    } catch {}
  }

  // ── 반려견 없음/로딩 ──
  if (dogsLoading) {
    return <div className="p-4 text-gray-400">불러오는 중...</div>
  }
  if (!dog) {
    return (
      <div className="p-4 animate-fadeIn">
        {/* 상단 */}
        <div className="flex justify-between items-center mb-4">
          {/* 제목 */}
          <div>
            <h1 className="text-[32px] font-extrabold text-txtcolor-700">
              산책 기록
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
              <p className="text-[14px] text-txtcolor-500 font-light">
                반려견과의 산책을 기록하고 체감을 남겨보세요.
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>

        <div className="flex flex-col items-center gap-3 py-16 text-txtcolor-300">
          <div className="text-[40px]">🐶</div>
          <p className="text-[14px]">반려견을 등록하면 산책을 기록할 수 있어요.</p>
          <button
            onClick={() => navigate('/dog-profile-create')}
            className="mt-2 px-4 py-2 
                     rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
          >
            반려견 등록하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            산책 기록
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              반려견과의 산책을 기록하고 체감을 남겨보세요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>

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
      <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-5 mb-[20px]">
      {/* 산책 대상 반려견 선택 (여러 마리일 때만, 동시 산책 = 복수 선택). 진행 중이면 잠금. */}
        {dogs.length > 0 && (
          <div className="mb-5">
            <div className="mb-4">
              <p className="text-[20px] font-bold text-txtcolor-700 flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-500 rounded-full" />
                {showEndForm
                  ? '📝 산책 기록 작성'
                  : isActive
                    ? '🚶‍➡️ 함께 산책 중'
                    : '🐶 산책할 반려견 선택'}
              </p>

              <span className="text-txtcolor-300 text-[12px] font-medium">
                {showEndForm
                  ? '오늘의 산책 정보를 남겨주세요.'
                  : isActive
                    ? '현재 선택된 반려견과 산책하고 있어요.'
                    : '함께 산책할 반려견을 선택해주세요.'}
              </span>
            </div>
            
            {isActive ? (
              <div className="flex flex-wrap gap-2 border-b border-txtcolor-100">
                {orderedSelectedDogs.map((d) => (
                  <div
                    key={d.dogId}
                    className="inline-flex items-center gap-2 px-3.5 py-2 mb-5 
                               rounded-full bg-brand-300 text-txtcolor-700 text-[13px] font-semibold"
                  >
                  {d.profileImageUrl ? (
                      <img
                        src={d.profileImageUrl}
                        onError={onImgError()}
                        className="w-[32px] h-[32px] rounded-full object-cover shadow"
                        alt={d.name}
                      />
                    ) : (
                      <div className="w-[32px] h-[32px] rounded-full shadow bg-white/90
                                      flex flex-col items-center justify-center">
                        <div className="text-[20px]">🐶</div>
                      </div>
                    )}
                    {d.name}
                    {d.isMain && (<span className="-ml-2 text-[12px]">⭐</span>)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 border-b border-txtcolor-100">
                {sortedDogs.map((d) => {
                  const on = selectedIds.includes(d.dogId)
                  return (
                    <button
                      key={d.dogId}
                      onClick={() => toggleDog(d.dogId)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 px-3.5 py-2 mb-5 rounded-full text-[13px] transition ${
                        on
                          ? 'bg-brand-300 text-txtcolor-700 font-semibold'
                          : 'bg-txtcolor-100/40 text-txtcolor-400'
                      }`}
                    >
                      {d.profileImageUrl ? (
                        <img
                          src={d.profileImageUrl}
                          onError={onImgError()}
                          className="w-[32px] h-[32px] rounded-full object-cover shadow"
                          alt={d.name}
                        />
                      ) : (
                        <div className="w-[32px] h-[32px] rounded-full shadow bg-white/90
                                        flex flex-col items-center justify-center">
                          <div className="text-[20px]">🐶</div>
                        </div>
                      )}
                      {d.name}
                      {d.isMain && (
                        <span className="-ml-2 text-[12px]">⭐</span>
                      )}
                      {on && <span className="text-txtcolor-700">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!isActive ? (
          // idle: 시작
          <>
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="h-[120px] flex items-center justify-center">
                {selectedIds.length === 0 ? (
                  <div className="text-[105px]">🤔</div>
                ) : dogs.length === 1 ? (
                  dogs[0].profileImageUrl ? (
                    <img
                      src={dogs[0].profileImageUrl}
                      onError={onImgError()}
                      alt={dogs[0].name}
                      className="w-[110px] h-[110px] rounded-full object-cover shadow"
                    />
                  ) : (
                    <div className="w-[110px] h-[110px] rounded-full shadow bg-txtcolor-100/25 flex items-center justify-center">
                      <div className="text-[40px]">🐶</div>
                    </div>
                  )
                ) : (
                  <div className="flex gap-2">
                    {orderedSelectedDogs.map((d) =>
                      d.profileImageUrl ? (
                        <img
                          key={d.dogId}
                          src={d.profileImageUrl}
                          onError={onImgError()}
                          alt={d.name}
                          className="w-[110px] h-[110px] rounded-full object-cover shadow"
                        />
                      ) : (
                        <div
                          key={d.dogId}
                          className="w-[110px] h-[110px] rounded-full shadow bg-txtcolor-100/25 flex items-center justify-center"
                        >
                          <div className="text-[40px]">🐶</div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <p className="text-[16px] text-txtcolor-700 font-semibold text-center">
                 {questionText}
              </p>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleStart}
                  disabled={busy}
                  className="px-8 py-3 rounded-full bg-txtcolor-700 text-white text-[16px] font-bold
                            mt-4 shadow-sm transition hover:bg-txtcolor-900 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2 font-bold text-[16px]">
                    <span className="text-[14px] leading-none">▶</span>
                    산책 시작
                  </span>
                </button>
              )}
            </div>
          </>
        ) : !showEndForm ? (
          // active: 타이머 + 종료
          <>
            <div className="flex flex-col items-center gap-4 p-6">
              <p className="text-[16px] text-brand-700 font-semibold animate-breathing">반려견과 산책 중...🐾</p>
              <div className='flex flex-col gap-2'>
                <div className="w-[300px] h-[120px] flex items-center justify-center 
                                rounded-xl shadow-sm relative overflow-hidden
                                bg-gradient-to-b from-[#6ACAFC]/50 via-[#6ACAFC]/15 to-[#6ACAFC]/10"
                >
                  <div className="text-[44px] font-extrabold text-txtcolor-700 tabular-nums">
                    {formatElapsed(elapsedSec)}
                  </div>
                  {/* 구름 느낌 */}
                  <div className="absolute top-3 left-4">
                    <div className="relative w-12 h-6">
                      <div className="absolute bottom-0 left-2 w-8 h-4 bg-white rounded-full" />
                      <div className="absolute bottom-1 left-0 w-5 h-5 bg-white rounded-full" />
                      <div className="absolute bottom-2 left-4 w-6 h-6 bg-white rounded-full" />
                      <div className="absolute bottom-1 right-0 w-5 h-5 bg-white rounded-full" />
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 64 32"
                    className="absolute top-8 right-4 w-12 h-6"
                  >
                    <path
                      d="M20 28h24a8 8 0 0 0 0-16 12 12 0 0 0-23-3A10 10 0 0 0 20 28z"
                      fill="white"
                    />
                  </svg>

                  {/* 잔디 */}
                  <div className="absolute bottom-0 w-full h-[30px] bg-[#DBF094]/80"/>

                  {/* 가로 흙길 */}
                  <div className="absolute w-[120%] h-3 bottom-[12px] left-[-10%] bg-[#F0D8A1] rounded-full"/>
                
                  <img src="/walkicon.png" alt="산책" className="w-[90px] h-[90px] relative z-10"/>
                </div>

                <div className='text-center bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 px-5 py-2'>
                  <p className="w-[260px] text-[13px] text-txtcolor-400">
                    {walkMessages[Math.floor(elapsedSec / 30) % walkMessages.length]}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setFrozenSec(elapsedSec) // 종료 누른 순간 시간 고정
                  setShowEndForm(true)
                }}
                className="px-8 py-3 rounded-full bg-orange-500 text-white text-[16px] font-bold
                           mt-4 shadow-sm transition hover:bg-orange-600/90 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 font-bold text-[16px]">
                  <span className="text-[14px] leading-none">■</span>
                  산책 종료
                </span>
              </button>
            </div>
          </>
        ) : (
          // 종료 폼: 거리 · 체감 · 메모
          <div className="text-left">
            <div className="flex flex-col items-center mb-8 gap-2">
              <p className="text-[18px] font-bold text-txtcolor-700">
                산책 종료
              </p>
              <div className="flex flex-col items-center w-full max-w-[340px] bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 px-5 py-4">
                <p className="mt-1 text-[14px] text-txtcolor-400">
                  총 산책 시간
                </p>
                <p className="text-[28px] font-extrabold text-brand-600 tabular-nums">
                  {formatElapsed(frozenSec)}
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {/* 걸은 경로를 지도에 찍으면 거리 자동 계산 → 아래 input 에 반영(수동 보정 가능) */}
              <div>
                <div className="mb-1">
                  <p className="text-[14px] font-semibold text-txtcolor-700 flex items-center gap-2">
                    산책 경로
                  </p>
                  <span className="text-txtcolor-300 text-[12px] font-medium">
                    지도에 산책한 경로에 맞게 좌클릭하면 자동으로 거리가 계산돼요.
                  </span>
                </div>

                <div className="">
                  <WalkPathMap
                    height={300}
                    onDistanceChange={(km) => setDistanceKm(km ? String(km) : '')}
                  />
                </div>
              </div>
              
              <div>
                <div className="mb-1">
                  <p className="text-[14px] font-semibold text-txtcolor-700 flex items-center">
                    총 산책 거리
                    <span className="ml-1 text-txtcolor-300">(km)</span>
                    <span className="ml-1 text-red-500">*</span>
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    placeholder="예) 11.5"
                    className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                              text-txtcolor-700 text-[14px]
                              focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                  />

                  {distanceKm && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-txtcolor-300 pointer-events-none">
                      km
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="mb-1">
                  <p className="text-[14px] font-semibold text-txtcolor-700 flex items-center">
                    오늘 산책 어땠나요?<span className="ml-1 text-red-500">*</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {THERMAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setThermal(opt.code)}
                      className={`flex-1 py-3 rounded-xl border text-[13px] font-semibold ${
                        thermal === opt.code 
                        ? "bg-brand-200 border-brand-500 text-txtcolor-700" 
                        : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                      }`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="mb-1">
                  <p className="text-[14px] font-semibold text-txtcolor-700 flex items-center">
                    메모<span className="ml-1 text-txtcolor-300">(선택)</span>
                  </p>
                </div>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="오늘 산책 한 줄 메모"
                  className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                            text-txtcolor-700 text-[14px]
                            focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 종료폼일 때만 카드 밖에 버튼 표시 */}
      {showEndForm && (
        <div className="flex justify-end gap-2 mb-6">
          <button
            onClick={handleFinish}
            disabled={busy}
            className="px-4 py-2 w-[90px]
                      rounded-xl bg-brand-300 text-txtcolor-700 text-[14px] font-bold
                      shadow-sm hover:bg-brand-400 transition"
          >
            기록 저장
          </button>
          <button
            onClick={() => setShowEndForm(false)}
            className="px-4 py-2 w-[90px]
                      rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                      shadow-sm hover:bg-txtcolor-200/60 transition"
          >
            취소
          </button>
        </div>
      )}

      {/* ── 산책 이력 ── */}
      <div className="flex justify-end gap-3 mt-[20px] pt-4 border-t border-txtcolor-100/60"/>
      <h2 className="flex flex-col text-[16px] font-bold text-txtcolor-700 mb-1">
        최근 산책<span className="text-txtcolor-300 text-[12px] font-medium">산책 기록은 최신순으로 최대 7개까지 표시돼요.</span>
      </h2>
      {histLoading ? (
        <div className="p-4 text-txtcolor-300">불러오는 중...</div>
      ) : walks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-txtcolor-300">
          <div className="text-[36px]">🐾</div>
          <p className="text-[14px]">아직 산책 기록이 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleWalks.map((w) => {
            const th = parseThermal(w.userFeedback)
            const badge = getDistanceBadge(w.distanceKm)
            
            return (
              <div key={w.walkId}
                   className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-5"
              >
                {/* 날짜 + 체감 */}
                <div className="flex items-center mb-2 gap-2">

                    <p className="text-[16px] font-bold text-txtcolor-700">
                      {w.startTime ? w.startTime.slice(0, 10).replaceAll('-', '.') : '—'}
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-[12px] font-semibold ${badge.className}`}
                    >
                      {badge.emoji} {badge.label}
                    </span>
                    
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-txtcolor-50/50 rounded-xl px-4 py-3">
                    <p className="text-[12px] text-txtcolor-300">산책 시간</p>
                    <p className="text-[16px] font-bold text-txtcolor-700 mt-1">
                      ⏱ {w.durationMinutes ?? 0}분
                    </p>
                  </div>
                  
                  <div className="bg-txtcolor-50/50 rounded-xl px-4 py-3">
                    <p className="text-[12px] text-txtcolor-300">산책 거리</p>
                    <p className="text-[16px] font-bold text-txtcolor-700 mt-1">
                      🚶‍➡️ {w.distanceKm ?? 0}km
                    </p>
                  </div>

                  <div className="bg-txtcolor-50/50 rounded-xl px-4 py-3">
                    <p className="text-[12px] text-txtcolor-300">산책 후기</p>
                    {th && (
                      <p className="text-[16px] font-bold text-txtcolor-700 mt-1">
                        {THERMAL_LABEL[th]}
                      </p>
                    )}
                  </div>
                </div>

                {/* 메모 */}
                {w.memo && (
                  <div className="border-t border-txtcolor-100 pt-3 mt-4">
                    <div className="mb-1">
                      <p className="text-[14px] font-semibold text-txtcolor-700 flex items-center">
                        📝 오늘의 산책 메모
                      </p>
                    </div>
                    <p className="text-[13px] text-txtcolor-500 leading-relaxed">
                      {w.memo}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WalkRecord
