import { useEffect, useMemo, useState } from 'react'
import { useDogs } from '../../hooks/useDogs'
import { useWalkStatistics } from '../../hooks/useWalkStatistics'
import { getWalkHistory } from '../../api/walk'
import { useNavigate } from 'react-router-dom'
import { onImgError } from '../../utils/imageFallback'

// 요일 라벨 (일~토)
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 'YYYY-MM-DD' → 로컬 Date (타임존 시프트 방지로 직접 파싱)
function getDayIndex(dateStr) {
  return new Date(dateStr).getDay()
}

// 현재 − 직전 델타. 부호·색을 위해 객체로 반환.
function delta(current, prev) {
  const diff = (current ?? 0) - (prev ?? 0)
  return {
    diff,
    text: diff > 0 ? `+${diff}` : `${diff}`,
    color: diff > 0 ? 'text-green-500' : diff < 0 ? 'text-danger' : 'text-txtcolor-300',
  }
}

// 통계 지표 카드 한 칸
function MetricCard({ label, value, unit, deltaInfo, deltaLabel, period }) {
  const isRate = label === '산책 출석률'

  const iconMap = {
    '총 산책 횟수': '👣',
    '총 산책 시간': '⏱',
    '평균 산책 시간': '📊',
    '산책 출석률': '🎯',
  }

  const getWalkLevel = () => {
    if (label !== '총 산책 횟수') return null
    if (period === 'WEEK') {
      if (value === 0) return '이번 주는 휴식 💤'
      if (value < 3) return '조금 산책했어요 🌿'
      if (value < 6) return '활동적 👍'
      return '매우 활발 🔥'
    }
    if (value === 0) return '이번 달 기록 없음 💤'
    if (value < 10) return '가벼운 활동 🌱'
    if (value < 20) return '꾸준한 산책 👍'
    return '엄청 활발 🔥'
  }

  const getTimeInsight = () => {
    if (label !== '총 산책 시간') return null
    const perDay = period === 'WEEK'
      ? Math.round(value / 7)
      : Math.round(value / 30)

    if (value === 0) return '산책 기록이 없어요 💤'
    if (period === 'WEEK') {
      if (perDay < 60) return `조금 더 산책해도 좋아요`
      if (perDay < 120) return `꾸준히 잘하고 있어요 👍`
      return `활동량이 아주 좋아요 🔥`
    }
    // MONTH
    if (value < 300) return `조금 더 산책해도 좋아요`
    if (value < 600) return `꾸준히 잘하고 있어요 👍`
    return `활동량이 아주 좋아요 🔥`
  }

  const getBadge = () => {
    if (label !== '평균 산책 시간') return null
    if (period === 'WEEK') {
      if (value < 20) return `조금 짧아요 🐕‍🦺`
      if (value < 40) return `적당해요 👍`
      return `오래 산책하는 편이에요 🐕`
    }
    // MONTH
    if (value < 300) return `조금 짧아요 🐕‍🦺`
    if (value < 600) return `적당해요 👍`
    return `오래 산책하는 편이에요 🐕`
  }
  
  return (
    <div className="bg-white rounded-xl border border-txtcolor-100/50 p-4 shadow-sm flex flex-col gap-3">
      {/* label */}
      <p className="border-b border-txtcolor-100/70 pb-2 text-[13px] font-medium text-txtcolor-700 flex items-center gap-2">
        <span>{iconMap[label]}</span>
        <span>{label}</span>
      </p>
      
      {/* value */}
      <div className='flex items-end justify-between'>
        <div className="flex items-end gap-1">
          <p className="text-[28px] text-txtcolor-700 font-extrabold leading-none">
            {value}
          </p>
          <span className="text-[13px] text-txtcolor-400">{unit}</span>
        </div>
        {/* delta */}
        {deltaInfo && (
          <p className={`text-xs font-medium ${deltaInfo.color}`}>
            {deltaLabel} {deltaInfo.text}
            {deltaInfo.diff === 0 && ' (변화 없음)'}
          </p>
        )}
      </div>
      
      {/* badge (총 산책횟수용) */}
      {getWalkLevel() && (
        <div className="text-[11px] px-3 py-2 bg-txtcolor-50/50 border border-txtcolor-50 text-txtcolor-400 rounded-lg w-full">
          {getWalkLevel()}
        </div>
      )}
      {/* badge (총 산책시간용) */}
      {getTimeInsight() && (
        <div className="text-[11px] px-3 py-2 bg-txtcolor-50/50 border border-txtcolor-50 text-txtcolor-400 rounded-lg w-full">
          {getTimeInsight()}
        </div>
      )}
      {/* badge (평균 산책 시간용) */}
      {getBadge() && (
        <div className="text-[11px] px-3 py-2 bg-txtcolor-50/50 border border-txtcolor-50 text-txtcolor-400 rounded-lg w-full">
          {getBadge()}
        </div>
      )}
      {/* progress (출석률만) */}
      {isRate && (
        <div className="mt-1">
          <div className="h-2 bg-txtcolor-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500/80 transition-all"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-txtcolor-400 mt-1">
            {value >= 60 ? '👍 좋아요' : '💡 더 산책해볼까요'}
          </p>
        </div>
      )}
    </div>
  )
}


// 연속 산책 문구
function getStreakUI(streak) {
  if (streak >= 14) {
    return {
      icon: '🔥',
      text: `${streak}일 연속 산책중`,
      style: 'bg-orange-100 text-orange-600',
    }
  }

  if (streak >= 7) {
    return {
      icon: '💪',
      text: `${streak}일 연속 산책중`,
      style: 'bg-brand-100 text-yellow-600',
    }
  }

  if (streak >= 3) {
    return {
      icon: '😁',
      text: `${streak}일 연속 산책중`,
      style: 'bg-brand-100 text-yellow-600',
    }
  }

  return {
    icon: '🙂',
    text: `${streak}일 연속 산책중`,
    style: 'bg-gray-200/50 text-txtcolor-500',
  }
}

// 날짜 정규화
function getDateKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
// 연속 streak 계산
function calcStreak(history) {
  if (!history?.length) return 0

  const dateSet = new Set(
    history.map(w => getDateKey(w.startTime))
  )

  let streak = 0
  const today = new Date()

  // 오늘부터 하루씩 뒤로 가면서 체크
  while (true) {
    const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

    if (dateSet.has(key)) {
      streak++
      today.setDate(today.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

function WalkReport() {
  const navigate = useNavigate()
  const { dogs } = useDogs()
  const mainDog = useMemo(() => dogs.find((d) => d.isMain) ?? dogs[0], [dogs])
  const [dogId, setDogId] = useState(null)
  const activeDogId = dogId ?? mainDog?.dogId ?? null
  const activeDog = dogs.find((d) => d.dogId === activeDogId) ?? mainDog

  const [period, setPeriod] = useState('WEEK')
  const { data: stat, loading } = useWalkStatistics(activeDogId, period)

  const reportLabel = period === 'WEEK' ? '이번 주' : '이번 달'
  const periodLabel = period === 'WEEK' ? '지난주' : '지난달'

  // 가장 많이 산책한 시간대
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

  // 최대 연속 산책 일수
  const maxStreak = useMemo(() => {
    if (!allHistory?.length) return 0

    const dateSet = new Set(allHistory.map(w => getDateKey(w.startTime)))

    let max = 0
    let current = 0
    const today = new Date()

    // 최근 60일 정도 탐색 (무한 루프 방지)
    for (let i = 0; i < 60; i++) {
      const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

      if (dateSet.has(key)) {
        current++
      } else {
        current = 0
      }

      max = Math.max(max, current)
      today.setDate(today.getDate() - 1)
    }

    return max
  }, [allHistory])

  // 요일별 산책 진행바 높이
  const barUnit = period === 'WEEK' ? 12 : 3

  // 요일별 산책 횟수 집계 (dailyBreakdown → 일~토)
  const weekdayCounts = useMemo(() => {
    const acc = [0, 0, 0, 0, 0, 0, 0]
    for (const d of stat?.dailyBreakdown ?? []) {
      acc[getDayIndex(d.date)] += d.count
    }
    return acc
  }, [stat])
  
  const topWeekday = weekdayCounts.some((c) => c > 0)
    ? weekdayCounts.indexOf(Math.max(...weekdayCounts))
    : null

  const walkDiff =
    (stat?.totalWalks ?? 0) -
    (stat?.previous?.totalWalks ?? 0)

  const favoriteTimeRange = useMemo(() => {
    if (!allHistory?.length) return null

    const filtered =
      activeDogId === null
        ? allHistory
        : allHistory.filter((w) => w.dogId === activeDogId)

    const bucket = {}

    for (const w of filtered) {
      if (!w.startTime) continue

      const hour = Number(w.startTime.slice(11, 13))
      const key = `${hour}:00~${hour + 1}:00`

      bucket[key] = (bucket[key] || 0) + 1
    }

    return Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])[0]?.[0]
  }, [allHistory, activeDogId])

  const walkStreak = useMemo(() => {
    const filtered =
      activeDogId === null
        ? allHistory
        : allHistory.filter((w) => w.dogId === activeDogId)

    return calcStreak(filtered)
  }, [allHistory, activeDogId])

  const streakUI = getStreakUI(walkStreak)

  const walkingType = useMemo(() => {
    if (!allHistory?.length) return null

    const filtered =
      activeDogId === null
        ? allHistory
        : allHistory.filter((w) => w.dogId === activeDogId)

    let morning = 0
    let afternoon = 0

    for (const w of filtered) {
      if (!w.startTime) continue

      const hour = Number(w.startTime.slice(11, 13))

      if (hour < 12) morning++
      else afternoon++
    }

    if (morning === 0 && afternoon === 0) return null

    if (morning > afternoon) return 'MORNING'
    if (afternoon > morning) return 'AFTERNOON'

    return 'BALANCED'
  }, [allHistory, activeDogId])
  


  if (!activeDogId) {
    return (
      <div className="p-4 animate-fadeIn">
        {/* 상단 */}
        <div className="flex justify-between items-center mb-4">
          {/* 제목 */}
          <div>
            <h1 className="text-[32px] font-extrabold text-txtcolor-700">
              주간/월간 리포트
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
              <p className="text-[14px] text-txtcolor-500 font-light">
                반려견의 산책 패턴과 활동량을 확인할 수 있어요.
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>

        <div className="flex flex-col items-center gap-3 py-16 text-txtcolor-300">
          <div className="text-[40px]">🐶</div>
          <p className="text-[14px]">반려견을 등록하면 리포트를 확인할 수 있어요.</p>
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
            주간/월간 리포트
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              반려견의 산책 패턴과 활동량을 확인할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>

      {/* 강아지/구간 선택 */}
      <section className="flex justify-end items-center mb-2">
        <div className="flex items-center gap-2">
          {dogs.length > 1 && (
            <select
              value={activeDogId}
              onChange={(e) => setDogId(Number(e.target.value))}
              className="text-[12px] border border-txtcolor-100 text-txtcolor-700 rounded-lg px-3 py-2"
            >
              {dogs.map((d) => (
                <option key={d.dogId} value={d.dogId}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <div className="w-px h-4 bg-txtcolor-400/40 mx-3" />
          <div className="inline-flex rounded-full gap-1">
            {['WEEK', 'MONTH'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-[12px] rounded-full ${
                  period === p ? 'bg-brand-300 font-semibold shadow-sm' : 'text-txtcolor-400'
                }`}
              >
                {p === 'WEEK' ? '주간' : '월간'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 통계 요약 */}
      <section className="relative bg-sky-50 border border-sky-200 rounded-xl px-5 py-4 mb-3">
        <div className="absolute top-4 right-5 flex flex-col items-end gap-1">
          {/* 연속산책일수 */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-semibold ${streakUI.style}`}>
            {streakUI.icon} {streakUI.text} / {maxStreak > 0 && (<span className='bg-white text-txtcolor-700 px-2 py-1 rounded-full'>최고 {maxStreak}일</span>)}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          {/* 프로필 */}
          {activeDog?.profileImageUrl ? (
            <img
              src={activeDog.profileImageUrl}
              onError={onImgError()}
              className="w-11 h-11 rounded-full object-cover shadow"
            />
          ) : (
            <div className="w-11 h-11 rounded-full shadow bg-white/90 flex items-center justify-center">
              <div className="text-[20px]">🐶</div>
            </div>
          )}

          {/* 텍스트 영역 */}
          <div className="flex flex-col">
            <h3 className="text-[16px] font-bold text-sky-600 leading-tight">
              {reportLabel} 산책 요약
            </h3>
            <p className="text-[12px] text-txtcolor-400">
              {activeDog?.name}의 산책 리포트
            </p>
          </div>
        </div>
        <div className="w-full h-[1px] bg-txtcolor-100 my-3"/>

        <p className="text-[14px] text-txtcolor-700 leading-6">
          {reportLabel}에{' '}<span className='font-bold'>총 {stat?.totalWalks}번</span>{' '}산책했어요.

          {walkDiff > 0 && (
            <> {periodLabel}보다 {walkDiff}번 더 많이 걸었네요.🎉 </>
          )}

          {walkDiff < 0 && (
            <> {periodLabel}보다 {Math.abs(walkDiff)}번 적게 걸었네요.😳 </>
          )}

          {walkDiff === 0 && (
            <> {periodLabel}와 동일한 횟수로 산책했어요.☺️ </>
          )}

          가장 많이 산책했던 요일은 <span className='font-bold'>{WEEKDAYS[topWeekday]}요일</span>이며,

          평균 산책 시간은 <span className='font-bold'>{stat?.avgDuration}분</span>이에요.
        </p>
      </section>

      {/* 지표 4개 + 지난주 대비 델타 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <MetricCard
          label="총 산책 횟수"
          value={loading ? '–' : stat?.totalWalks ?? 0}
          unit="회"
          deltaInfo={stat && delta(stat.totalWalks, stat.previous?.totalWalks)}
          deltaLabel={`${periodLabel} 대비`}
          period={period}
        />
        <MetricCard
          label="총 산책 시간"
          value={loading ? '–' : stat?.totalMinutes ?? 0}
          unit="분"
          deltaInfo={stat && delta(stat.totalMinutes, stat.previous?.totalMinutes)}
          deltaLabel={`${periodLabel} 대비`}
          period={period}
        />
        <MetricCard
          label="평균 산책 시간"
          value={loading ? '–' : stat?.avgDuration ?? 0}
          unit="분"
          deltaInfo={stat && delta(stat.avgDuration, stat.previous?.avgDuration)}
          deltaLabel={`${periodLabel} 대비`}
          period={period}
        />
        <MetricCard
          label="산책 출석률"
          value={loading ? '–' : stat?.achievementRate ?? 0}
          unit="%"
          deltaInfo={stat && delta(stat.achievementRate, stat.previous?.achievementRate)}
          deltaLabel={`${periodLabel} 대비`}
          period={period}
        />
      </section>

      <section className="flex flex-col gap-3 bg-white rounded-xl border border-txtcolor-100/50 p-4 mb-3 shadow-sm">
        <p className="border-b border-txtcolor-100/70 pb-2 text-[13px] font-medium text-txtcolor-700 flex items-center gap-2">
          <span>🕑</span>
          <span>가장 많이 산책한 시간대</span>
        </p>

        <p className="text-[28px] font-extrabold">
          {favoriteTimeRange ?? '데이터 없음'}
        </p>

        <p className="text-[11px] px-3 py-2 bg-txtcolor-50/50 border border-txtcolor-50 text-txtcolor-400 rounded-lg w-full">
          {walkingType === 'MORNING' && '주로 오전에 산책하는 스타일이에요 ☀️'}
          {walkingType === 'AFTERNOON' && '주로 오후에 산책하는 스타일이에요 🌇'}
          {walkingType === 'BALANCED' && '오전/오후가 균형 잡힌 산책 스타일이에요 ⚖️'}
          {!walkingType && '산책 패턴을 분석 중이에요'}
        </p>
      </section>

      {/* 요일별 산책 + 가장 많이 산책한 요일 */}
      <section className="flex flex-col gap-3 bg-white rounded-xl border border-txtcolor-100/50 px-5 py-4 shadow-sm">
        <p className="border-b border-txtcolor-100/70 pb-2 text-[13px] font-medium text-txtcolor-700 flex items-center gap-2">
          <span>📆</span>
          <span>요일별 산책</span>
        </p>
        <div className="flex justify-end mb-4">
          {topWeekday != null && (
            <p className="text-[12px] text-txtcolor-400">
              가장 많이 산책한 요일{' '}
              <span className="font-bold text-green-500">{WEEKDAYS[topWeekday]}요일</span>
            </p>
          )}
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekdayCounts.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`mx-auto w-[20px] rounded-t-lg transition-all ${
                    i === topWeekday ? 'bg-sky-500/90' : 'bg-sky-300/90'
                  }`}
                  style={{ height: `${count * barUnit}px` }}
                  title={`${count}회`}
                />
              </div>
              <span className="text-[13px] font-medium text-txtcolor-500">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default WalkReport
