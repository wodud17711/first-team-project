import { useMemo, useState, useRef, useEffect } from 'react'
import { useDogs } from '../../hooks/useDogs'
import { useWalkStatistics, useWalkCalendar } from '../../hooks/useWalkStatistics'
import { parseThermal, } from '../../hooks/useWalkRecord'
import { useNavigate } from 'react-router-dom'
import { getWalkHistory } from '../../api/walk'
import { onImgError } from '../../utils/imageFallback'


// 요일 라벨 (일~토)
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// ISO datetime → 'HH:mm'
function hhmm(iso) {
  return iso ? iso.slice(11, 16) : ''
}

// 'YYYY-MM-DD' → 로컬 Date (타임존 시프트 방지로 직접 파싱)
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function WalkCalendar() {
  
  const navigate = useNavigate()
  const { dogs } = useDogs()
  const mainDog = useMemo(() => dogs.find((d) => d.isMain) ?? dogs[0], [dogs])
  const [dogId, setDogId] = useState(null)
  const activeDogId = dogId ?? mainDog?.dogId ?? null
  const activeDog = dogs.find((d) => d.dogId === activeDogId) ?? mainDog

  const [period, setPeriod] = useState('WEEK')
  const { data: stat, loading } = useWalkStatistics(activeDogId, period)

  // 캘린더: 이번 달 기준
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const { data: cal } = useWalkCalendar(activeDogId, ym.year, ym.month)


  // 요일별 산책 횟수 집계 (dailyBreakdown → 일~토)
  const weekdayCounts = useMemo(() => {
    const acc = [0, 0, 0, 0, 0, 0, 0]
    for (const d of stat?.dailyBreakdown ?? []) {
      acc[parseDate(d.date).getDay()] += d.count
    }
    return acc
  }, [stat])


  // 캘린더 그리드(주 단위) — 산책한 날 표시용 map
  const calMap = useMemo(() => {
    const m = new Map()
    for (const d of cal?.days ?? []) m.set(d.date, d)
    return m
  }, [cal])

  const calendarCells = useMemo(() => {
    const first = new Date(ym.year, ym.month - 1, 1)
    const daysInMonth = new Date(ym.year, ym.month, 0).getDate()
    const lead = first.getDay() // 1일 앞 빈칸 수
    const cells = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${ym.year}-${String(ym.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, iso, info: calMap.get(iso) })
    }
    return cells
  }, [ym, calMap])


  // 캘린더, 산책기록에 산책한 모든 강아지가 뜨도록
  const [allHistory, setAllHistory] = useState([])
  useEffect(() => {
    if (!dogs?.length) return

    let alive = true

    Promise.all(dogs.map(d => getWalkHistory(d.dogId)))
      .then((results) => {
        if (!alive) return
        setAllHistory(results.flat())
      })

    return () => {
      alive = false
    }
  }, [dogs])

  const histByDate = useMemo(() => {
    const m = new Map()

    for (const w of allHistory ?? []) {
      const iso = w.startTime?.slice(0, 10)
      if (!iso) continue

      if (!m.has(iso)) m.set(iso, [])
      m.get(iso).push(w)
    }

    return m
  }, [allHistory])

  const histByDateAndDog = useMemo(() => {
    const m = new Map()

    for (const w of allHistory ?? []) {
      const iso = w.startTime?.slice(0, 10)
      if (!iso || !w.dogId) continue

      if (!m.has(iso)) m.set(iso, new Map())

      const dogMap = m.get(iso)
      if (!dogMap.has(w.dogId)) dogMap.set(w.dogId, w)
    }

    return m
  }, [allHistory])

  // 달력 높이에 따라 산책기록 높이 바뀌게
  const calendarRows = useMemo(() => {
    return Math.ceil(calendarCells.length / 7)
  }, [calendarCells])
  const listMaxHeight = calendarRows === 6 ? 522 : 420

  // 산책기록에 강아지 필터 드롭다운
  const [selectedDogId, setSelectedDogId] = useState('ALL')

   // 대표강아지가 먼저 오도록
  const sortedDogs = useMemo(() => {
    return [...dogs].sort((a, b) => (b.isMain === true) - (a.isMain === true))
  }, [dogs])

  const selectedDogName = useMemo(() => {
    if (selectedDogId === 'ALL') return '전체'
    return sortedDogs.find(d => d.dogId === Number(selectedDogId))?.name ?? '전체'
  }, [selectedDogId, sortedDogs])

  // 체감 옵션
  const THERMAL_LABEL = {
    HOT: '🥵 더움',
    OK: '🙂 적당',
    COLD: '🥶 추움',
  }

  // 기록 카드 내 거리별 배지
  const getDistanceBadge = (distanceKm) => {
    const distance = Number(distanceKm ?? 0)
    if (distance >= 8)
      return {
        label: '장거리 산책', emoji: '🥇', className: 'bg-purple-100 text-purple-700 font-medium'}
    if (distance >= 3)
      return {
        label: '중거리 산책', emoji: '🥈', className: 'bg-brand-100 text-orange-700/90 font-medium'}
    return {
      label: '단거리 산책', emoji: '🥉', className: 'bg-green-100/60 text-green-700 font-medium'}
  }


  const calRef = useRef(null)
  const [popover, setPopover] = useState(null) // { iso, x, y }
  const [pinned, setPinned] = useState(false)

  const openPopover = (iso, el) => {
    const s = calRef.current?.getBoundingClientRect()
    if (!s) return
    const c = el.getBoundingClientRect()
    setPopover({ iso, x: c.left - s.left + c.width / 2, y: c.bottom - s.top })
  }

  const handleCellClick = (iso, el) => {
    if (pinned && popover?.iso === iso) { setPinned(false); setPopover(null) }
    else { setPinned(true); openPopover(iso, el) }
  }

  const shiftMonth = (delta) => {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  if (!activeDogId) {
    return (
      <div className="p-4 animate-fadeIn">
        {/* 상단 */}
        <div className="flex justify-between items-center mb-4">
          {/* 제목 */}
          <div>
            <h1 className="text-[32px] font-extrabold text-txtcolor-700">
              산책 캘린더
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
              <p className="text-[14px] text-txtcolor-500 font-light">
                산책 기록이 달력에 쌓여 반려견과의 활동을 한눈에 볼 수 있어요.
              </p>
            </div>
          </div>
        </div>
        <div className='w-full h-[1px] bg-txtcolor-400/40 mb-[20px]'/>

        <div className="flex flex-col items-center gap-3 py-16 text-txtcolor-300">
          <div className="text-[40px]">🐶</div>
          <p className="text-[14px]">반려견을 등록하면 산책 캘린더를 사용할 수 있어요.</p>
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
            산책 캘린더
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              산책 기록이 달력에 쌓여 반려견과의 활동을 한눈에 볼 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full h-[1px] bg-txtcolor-400/40 mb-[20px]'/>

      {/* 산책 캘린더 (강아지 사진 스티커) */}
      <div className="flex gap-4">
        <section ref={calRef} className="relative flex-1 min-w-0 bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-6">
          <div className="flex items-center justify-center gap-4 text-[24px] mb-2">
            <button onClick={() => shiftMonth(-1)} className="text-txtcolor-300 hover:text-txtcolor-700">‹</button>
            <span className="font-extrabold text-txtcolor-700">
              {ym.year}.{String(ym.month).padStart(2, '0')}
            </span>
            <button onClick={() => shiftMonth(1)} className="text-txtcolor-300 hover:text-txtcolor-700">›</button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden text-center">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`bg-brand-100 text-[13px] rounded-xl font-bold py-2 
                                      ${i === 0 ? 'text-danger' : 'text-txtcolor-700'}`}>
                {w}
              </div>
            ))}
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={idx} />
              const count = cell?.info?.count ?? 0
              const isToday = cell?.iso === todayIso
            
              const dogMap = histByDateAndDog.get(cell.iso)
              const dogsInDay = (dogMap ? Array.from(dogMap.values()) : [])
                .map((w) => sortedDogs.find((d) => d.dogId === w.dogId))
                .filter(Boolean)
                .sort((a, b) => (b.isMain === true) - (a.isMain === true))

              return (
                <div
                  key={idx}
                  className={`relative aspect-square bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-2 flex flex-col overflow-y-auto ${
                    count > 0 ? 'cursor-pointer' : ''
                  } ${isToday ? 'bg-[#FFF6CC]/40 border border-[#FFE066] hover:bg-[#FFF6CC]/80 transition' 
                              : 'bg-white hover:bg-txtcolor-50/40 transition'}`}
                  // onMouseEnter={count > 0 ? (e) => handleCellEnter(cell.iso, e.currentTarget) : undefined}
                  // onMouseLeave={count > 0 ? handleCellLeave : undefined}
                  onClick={count > 0 ? (e) => handleCellClick(cell.iso, e.currentTarget) : undefined}
                >
                  {cell && (
                    <>
                      {/* 날짜: 좌상단 (실제 달력처럼 한 곳으로) */}
                      <span className="text-[13px] leading-none text-txtcolor-400 font-medium self-start">
                        {cell.day}
                      </span>

                      {/* 산책 표시: 강아지 사진(산책 횟수 상관 X, 산책하면 생김) — 셀 가운데 정렬 */}
                      {dogsInDay.length > 0 && (
                      <div className="flex-1 flex items-center justify-center gap-[5px] flex-wrap mt-1.5">
                        {dogsInDay.map((dog) => (
                          dog?.profileImageUrl ? (
                            <img
                              key={dog.dogId}
                              src={dog.profileImageUrl}
                              onError={onImgError()}
                              className="w-7 h-7 rounded-full object-cover shadow"
                            />
                          ) : (
                            <div key={dog.dogId} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              🐶
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <aside className="w-[320px] min-h-[600px] flex flex-col flex-shrink-0 p-4
                  bg-white rounded-xl border border-txtcolor-100/50 shadow-sm">

          {/* 1) 기본 상태 (날짜 선택 X) */}
          {!popover && (
            <div className="flex flex-col flex-1">
              
              {/* 상단 고정 영역 */}
              <div className="border-b border-txtcolor-100">
                <p className="text-[20px] font-bold text-txtcolor-700 flex items-center gap-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full" />
                  산책 기록
                </p>
                <p className="text-[12px] text-txtcolor-300 font-medium mt-1 mb-2">
                  캘린더에서 날짜를 클릭하면 산책 기록이 보여요.
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-[40px]">📆</p>
                <p className="text-[16px] text-txtcolor-700 font-semibold text-center mt-2">
                  반려견과의 산책 기록을 확인해볼까요?
                </p>
              </div>

            </div>
          )}

          {/* 2) 날짜 선택 후 */}
          {popover && (() => {
            const rawWalks = histByDate.get(popover.iso) ?? []

            const walks =
              selectedDogId === 'ALL'
                ? rawWalks
                : rawWalks.filter((w) => w.dogId === Number(selectedDogId))
            .slice()
            .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))

            const [, mm, dd] = popover.iso.split('-')

            const totalMin = walks.reduce((s, w) => s + (w.durationMinutes ?? 0), 0)
            const totalKm = walks.reduce((s, w) => s + Number(w.distanceKm ?? 0), 0)

            return (
              <div className="flex flex-col h-full">
                <div className='border-b border-txtcolor-100'>
                  <p className="text-[20px] font-bold text-txtcolor-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand-500 rounded-full" />
                    산책 기록
                  </p>
                  <p className="text-[12px] text-txtcolor-300 font-medium mt-1 mb-2">
                    캘린더에서 날짜를 클릭하면 산책 기록이 보여요.
                  </p>
                </div>
                
                <div className="mb-2 flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-[14px] font-semibold">
                    <p className='px-3 py-[2px] rounded-full bg-sky-100 text-sky-600'>{Number(mm)}월 {Number(dd)}일</p>
                  </div>
                
                  <select
                    value={selectedDogId}
                    onChange={(e) => setSelectedDogId(e.target.value)}
                    className="text-[12px] border border-txtcolor-100 text-txtcolor-700 rounded px-2 py-1"
                  >
                    <option value="ALL">전체</option>
                    {sortedDogs.map((d) => (
                      <option key={d.dogId} value={d.dogId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 border border-txtcolor-100/50 rounded-xl
                                text-center text-[12px] text-txtcolor-400 mb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-txtcolor-700">{walks.length}회</p>
                    <p>산책 횟수</p>
                  </div>
                  <div className="w-px h-8 bg-txtcolor-100/70" />
                  <div className="flex-1">
                    <p className="font-semibold text-txtcolor-700">{totalMin}분</p>
                    <p>소요시간</p>
                  </div>
                  <div className="w-px h-8 bg-txtcolor-100/70" />
                  <div className="flex-1">
                    <p className="font-semibold text-txtcolor-700">
                      {totalKm.toFixed(1)}km
                    </p>
                    <p>산책 거리</p>
                  </div>
                </div>

                {walks.length > 0 ? (
                  <ul style={{ maxHeight: listMaxHeight }} className="space-y-2 overflow-y-auto">
                    {walks.map((w) => {
                      const badge = getDistanceBadge(w.distanceKm)
                      const th = parseThermal(w.userFeedback)

                      return (
                      <li key={w.walkId} className="text-[12px] px-[10px] py-2 bg-txtcolor-50/50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <p className="flex items-center gap-2 text-[13px] font-bold text-txtcolor-700">
                            <span className="block w-1 h-3 bg-txtcolor-200 rounded-full"/>
                            {hhmm(w.startTime)} ~ {hhmm(w.endTime)}
                          </p>
                          <span className={`text-[10px] px-2 py-1 rounded-full ${badge.className}`}>
                            {badge.emoji} {badge.label}
                          </span>
                        </div>
                        <div className='w-full h-px bg-txtcolor-100 mt-1.5'/>
                        
                        <div className='mt-2 px-6 flex items-center justify-between text-[12px] text-txtcolor-400'>
                          {th && (<p>{THERMAL_LABEL[th]}</p>)}
                          <div className='w-px h-3 bg-txtcolor-100'/>
                          <p>⏱️ {w.durationMinutes}분</p>
                          <div className='w-px h-3 bg-txtcolor-100'/>
                          <p>🚶‍➡️ {w.distanceKm ?? 0}km</p>
                        </div>

                        {w.memo && (
                          <div className="mt-2 p-2 bg-white/90 rounded-lg text-txtcolor-500">
                            📝 {w.memo}
                          </div>
                        )}
                      </li>
                    )})}
                  </ul>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-[40px]">💤</p>
                    <p className="text-[16px] text-txtcolor-700 font-semibold text-center mt-2">
                      기록이 없습니다
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

        </aside>
      </div>
      
    </div>
  )
}

export default WalkCalendar
