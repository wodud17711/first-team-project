import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useDogs } from '../hooks/useDogs'
import { useWalkScore } from '../hooks/useWalkScore'
import WalkScoreD from '../components/WalkScore/WalkScoreD.jsx'

function WalkScoreDetail() {
  const navigate = useNavigate()
  const { dogs, loading: dogsLoading } = useDogs()

  // 대표 강아지 먼저 계산
  const mainDog = useMemo(
    () => dogs?.find((d) => d.isMain) ?? dogs?.[0],
    [dogs]
  )

  // 초기값을 mainDog 기반으로 세팅
  const [selectedDogId, setSelectedDogId] = useState(null)

  useEffect(() => {
    if (dogs?.length && selectedDogId == null) {
      const main = dogs.find(d => d.isMain) ?? dogs[0]
      setSelectedDogId(main?.dogId)
    }
  }, [dogs, selectedDogId])

  const sortedDogs = useMemo(() => {
    if (!dogs?.length) return []

    return [...dogs].sort((a, b) => {
      // 대표 강아지 먼저
      if (a.isMain) return -1
      if (b.isMain) return 1
      return 0
    })
  }, [dogs])

  // 산책지수 조회 (선택된 강아지 기준)
  const { data: walk, loading: walkLoading, notReady: walkNotReady } =
    useWalkScore(selectedDogId)

  const selectedDog = dogs?.find(d => d.dogId === selectedDogId)

  // ── 반려견 없음/로딩 ──
  if (dogsLoading) {
    return <div className="p-4 text-gray-400">불러오는 중...</div>
  }

  if (!dogs || dogs.length === 0) {
    return (
      <div className="p-4 animate-fadeIn">
        {/* 상단 */}
        <div className="relative flex justify-between items-start mb-4">
          <div>
            <h1 className="text-[32px] font-extrabold text-txtcolor-700">
              오늘의 산책지수
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
              <p className="text-[14px] text-txtcolor-500 font-light">
                날씨와 환경을 분석해 우리 반려견에게 맞는 오늘의 산책 지수를 알려드려요.
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />

        <div className="flex flex-col items-center gap-3 py-16 text-txtcolor-300">
          <div className="text-[40px]">🐶</div>
          <p className="text-[14px]">반려견을 등록하면 오늘의 산책지수를 확인할 수 있어요.</p>
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
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            오늘의 산책지수
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              날씨와 환경을 분석해 우리 반려견에게 맞는 오늘의 산책 지수를 알려드려요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />

      {/* 강아지 선택 드롭다운 */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <p className="text-[13px] text-txtcolor-400">반려견을 선택하면 각 아이에게 맞는 산책지수를 확인할 수 있어요.</p>
        <select
          value={selectedDogId || ''}
          onChange={(e) => setSelectedDogId(Number(e.target.value))}
          className="text-[12px] border border-txtcolor-100 text-txtcolor-700 rounded-lg px-3 py-2"
        >
          {sortedDogs.map((dog) => (
            <option key={dog.dogId} value={dog.dogId}>
              {dog.name}
            </option>
          ))}
        </select>
      </div>

      {/* 산책지수 카드 */}
      <WalkScoreD
        score={walk?.score}
        level={walk?.level}
        reasons={walk?.topReasons ?? []}
        loading={walkLoading}
        notReady={walkNotReady}
        hasDog={!!selectedDogId}
        weather={walk?.weather ?? null}
        dogName={selectedDog?.name}
        profileImageUrl={selectedDog?.profileImageUrl}
      />
    </div>
  )
}

export default WalkScoreDetail