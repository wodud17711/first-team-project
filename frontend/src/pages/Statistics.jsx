import { useMemo, useState, useRef } from 'react'
import { useDogs } from '../hooks/useDogs'
import { useWalkStatistics, useWalkCalendar } from '../hooks/useWalkStatistics'
import { useWalkHistory } from '../hooks/useWalkRecord'
import dogImgFallback from '../assets/dogImg1.jpg'

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

// 현재 − 직전 델타. 부호·색을 위해 객체로 반환.
function delta(current, prev) {
  const diff = (current ?? 0) - (prev ?? 0)
  return {
    diff,
    text: diff > 0 ? `+${diff}` : `${diff}`,
    color: diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-gray-400',
  }
}

// 통계 지표 카드 한 칸
function MetricCard({ label, value, unit, deltaInfo, deltaLabel }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
      {deltaInfo && (
        <p className={`text-xs font-medium ${deltaInfo.color}`}>
          {deltaLabel} {deltaInfo.text}
          {deltaInfo.diff === 0 && ' (변화 없음)'}
        </p>
      )}
    </div>
  )
}

function Statistics() {
  const { dogs } = useDogs()
  const mainDog = useMemo(() => dogs.find((d) => d.isMain) ?? dogs[0], [dogs])
  const [dogId, setDogId] = useState(null)
  const activeDogId = dogId ?? mainDog?.dogId ?? null
  const activeDog = dogs.find((d) => d.dogId === activeDogId) ?? mainDog

  const [period, setPeriod] = useState('WEEK')
  const { data: stat, loading } = useWalkStatistics(activeDogId, period)

  // 캘린더: 이번 달 기준
  const now = new Date()
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const { data: cal } = useWalkCalendar(activeDogId, ym.year, ym.month)

  const periodLabel = period === 'WEEK' ? '지난주' : '지난달'

  // 요일별 산책 횟수 집계 (dailyBreakdown → 일~토)
  const weekdayCounts = useMemo(() => {
    const acc = [0, 0, 0, 0, 0, 0, 0]
    for (const d of stat?.dailyBreakdown ?? []) {
      acc[parseDate(d.date).getDay()] += d.count
    }
    return acc
  }, [stat])
  const maxWeekdayCount = Math.max(1, ...weekdayCounts)
  const topWeekday = weekdayCounts.some((c) => c > 0)
    ? weekdayCounts.indexOf(Math.max(...weekdayCounts))
    : null

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

  // 산책 이력(날짜별 그룹) — 캘린더 hover/클릭 상세 팝오버용
  const { walks: history } = useWalkHistory(activeDogId)
  const histByDate = useMemo(() => {
    const m = new Map()
    for (const w of history ?? []) {
      const iso = w.startTime?.slice(0, 10)
      if (!iso) continue
      if (!m.has(iso)) m.set(iso, [])
      m.get(iso).push(w)
    }
    return m
  }, [history])

  // 팝오버: hover 미리보기 + 클릭 고정(pinned). 위치는 캘린더 섹션 기준 좌표.
  const calRef = useRef(null)
  const [popover, setPopover] = useState(null) // { iso, x, y }
  const [pinned, setPinned] = useState(false)

  const openPopover = (iso, el) => {
    const s = calRef.current?.getBoundingClientRect()
    if (!s) return
    const c = el.getBoundingClientRect()
    setPopover({ iso, x: c.left - s.left + c.width / 2, y: c.bottom - s.top })
  }
  const handleCellEnter = (iso, el) => { if (!pinned) openPopover(iso, el) }
  const handleCellLeave = () => { if (!pinned) setPopover(null) }
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
      <div className="p-6 text-center text-gray-500">
        반려견을 먼저 등록하면 산책 통계를 볼 수 있어요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 헤더 + 강아지/구간 선택 */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">산책 통계</h1>
          <p className="text-sm text-gray-500">
            {activeDog?.name}의 {period === 'WEEK' ? '이번 주' : '이번 달'} 산책 기록
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dogs.length > 1 && (
            <select
              value={activeDogId}
              onChange={(e) => setDogId(Number(e.target.value))}
              className="text-sm border rounded-lg px-2 py-1"
            >
              {dogs.map((d) => (
                <option key={d.dogId} value={d.dogId}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            {['WEEK', 'MONTH'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md ${
                  period === p ? 'bg-white font-bold shadow-sm' : 'text-gray-500'
                }`}
              >
                {p === 'WEEK' ? '주간' : '월간'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 지표 4개 + 지난주 대비 델타 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="총 산책 횟수"
          value={loading ? '–' : stat?.totalWalks ?? 0}
          unit="회"
          deltaInfo={stat && delta(stat.totalWalks, stat.previous?.totalWalks)}
          deltaLabel={`${periodLabel} 대비`}
        />
        <MetricCard
          label="총 산책 시간"
          value={loading ? '–' : stat?.totalMinutes ?? 0}
          unit="분"
          deltaInfo={stat && delta(stat.totalMinutes, stat.previous?.totalMinutes)}
          deltaLabel={`${periodLabel} 대비`}
        />
        <MetricCard
          label="1회 평균"
          value={loading ? '–' : stat?.avgDuration ?? 0}
          unit="분"
          deltaInfo={stat && delta(stat.avgDuration, stat.previous?.avgDuration)}
          deltaLabel={`${periodLabel} 대비`}
        />
        <MetricCard
          label="달성률"
          value={loading ? '–' : stat?.achievementRate ?? 0}
          unit="%"
          deltaInfo={stat && delta(stat.achievementRate, stat.previous?.achievementRate)}
          deltaLabel={`${periodLabel} 대비`}
        />
      </section>

      {/* 요일별 산책 + 가장 많이 산책한 요일 */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold">요일별 산책</h3>
          {topWeekday != null && (
            <p className="text-xs text-gray-500">
              가장 많이 산책한 요일{' '}
              <span className="font-bold text-success">{WEEKDAYS[topWeekday]}요일</span>
            </p>
          )}
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekdayCounts.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    i === topWeekday ? 'bg-success' : 'bg-brand-200'
                  }`}
                  style={{ height: `${(count / maxWeekdayCount) * 100}%`, minHeight: count > 0 ? '6px' : '0' }}
                  title={`${count}회`}
                />
              </div>
              <span className="text-xs text-gray-500">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 산책 캘린더 (강아지 사진 스티커) */}
      <section ref={calRef} className="relative bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">산책 캘린더</h3>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => shiftMonth(-1)} className="text-gray-400 hover:text-gray-700">‹</button>
            <span className="font-medium">
              {ym.year}.{String(ym.month).padStart(2, '0')}
            </span>
            <button onClick={() => shiftMonth(1)} className="text-gray-400 hover:text-gray-700">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-300 border border-gray-300 rounded-lg overflow-hidden text-center">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`bg-white text-xs py-2 ${i === 0 ? 'text-danger' : 'text-gray-400'}`}>
              {w}
            </div>
          ))}
          {calendarCells.map((cell, idx) => {
            const count = cell?.info?.count ?? 0
            const MAX_DOTS = 3 // 그 이상은 +N 으로 축약
            const dotImg = activeDog?.profileImageUrl || dogImgFallback
            return (
              <div
                key={idx}
                className={`aspect-square p-1.5 flex flex-col ${
                  count > 0 ? 'bg-brand-100/40 cursor-pointer' : 'bg-white'
                }`}
                onMouseEnter={count > 0 ? (e) => handleCellEnter(cell.iso, e.currentTarget) : undefined}
                onMouseLeave={count > 0 ? handleCellLeave : undefined}
                onClick={count > 0 ? (e) => handleCellClick(cell.iso, e.currentTarget) : undefined}
              >
                {cell && (
                  <>
                    {/* 날짜: 좌상단 (실제 달력처럼 한 곳으로) */}
                    <span className="text-xs leading-none text-gray-500 self-start">
                      {cell.day}
                    </span>

                    {/* 산책 표시: 횟수만큼 동그라미(강아지 사진) — 셀 가운데 정렬 */}
                    {count > 0 && (
                      <div
                        className="flex-1 flex flex-wrap items-center justify-center content-center gap-1"
                      >
                        {Array.from({ length: Math.min(count, MAX_DOTS) }).map((_, i) => (
                          <img
                            key={i}
                            src={dotImg}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow"
                          />
                        ))}
                        {count > MAX_DOTS && (
                          <span className="text-[12px] font-semibold text-gray-500 leading-none">
                            +{count - MAX_DOTS}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* 산책 상세 팝오버 (hover 미리보기 / 클릭 고정) */}
        {popover && (() => {
          const walks = (histByDate.get(popover.iso) ?? [])
            .slice()
            .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
          const [, mm, dd] = popover.iso.split('-')
          const totalMin = walks.reduce((s, w) => s + (w.durationMinutes ?? 0), 0)
          const totalKm = walks.reduce((s, w) => s + Number(w.distanceKm ?? 0), 0)
          return (
            <div
              className="absolute z-30 w-60 -translate-x-1/2 mt-1 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-lg"
              style={{ left: popover.x, top: popover.y }}
              onMouseEnter={() => { if (!pinned) setPopover(popover) }}
              onMouseLeave={handleCellLeave}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">
                  {Number(mm)}/{Number(dd)} {activeDog?.name ?? ''} 산책
                </p>
                {pinned && (
                  <button
                    onClick={() => { setPinned(false); setPopover(null) }}
                    className="text-gray-400 hover:text-gray-700 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mb-2 text-xs text-gray-500">
                {walks.length}회 · 총 {totalMin}분{totalKm > 0 ? ` · ${totalKm.toFixed(1)}km` : ''}
              </p>
              {walks.length > 0 ? (
                <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                  {walks.map((w) => (
                    <li key={w.walkId} className="border-t border-gray-100 pt-1.5 text-xs first:border-t-0 first:pt-0">
                      <div className="font-medium text-gray-700">
                        {hhmm(w.startTime)}{w.endTime ? `~${hhmm(w.endTime)}` : ''}
                        <span className="font-normal text-gray-400">
                          {' · '}{w.durationMinutes != null ? `${w.durationMinutes}분` : '진행 중'}
                          {w.distanceKm != null ? ` · ${Number(w.distanceKm).toFixed(1)}km` : ''}
                        </span>
                      </div>
                      {w.memo && <p className="mt-0.5 break-words text-gray-500">📝 {w.memo}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">상세 기록이 없어요</p>
              )}
            </div>
          )
        })()}
      </section>
    </div>
  )
}

export default Statistics
