
import { useNavigate } from 'react-router-dom'
import { useDogs } from '../hooks/useDogs'
import { useWalkScore } from '../hooks/useWalkScore'
import WalkScore from '../components/WalkScore/WalkScore'


function WalkScoreDetail() {
  const navigate = useNavigate()
  const { dogs, loading: dogsLoading } = useDogs()
  const dog = dogs[0] // 대표 반려견 (Home 과 동일 규칙)

  // 산책지수: 대표 반려견 기준 실 API 조회 (Home 카드와 동일 배선).
  // dog 없을 때 dogId=undefined → 훅이 미호출. 훅은 early return 위에서 무조건 호출.
  const { data: walk, loading: walkLoading, notReady: walkNotReady } = useWalkScore(dog?.dogId)


  // ── 반려견 없음/로딩 ──
  if (dogsLoading) {
    return <div className="p-4 text-gray-400">불러오는 중...</div>
  }
  if (!dog) {
    return (
      <div className="p-4 animate-fadeIn">
        <h1 className="text-[28px] font-extrabold text-sky-800 mb-3">🐾 오늘의 산책지수</h1>
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

      {/* 상단 */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">오늘의 산책지수</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              날씨와 환경을 분석해 우리 반려견에게 맞는 오늘의 산책 지수를 알려드려요.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />

      {/* 산책지수 카드 (Home 과 동일 컴포넌트·props 재사용) */}
      <WalkScore
        score={walk?.score}
        level={walk?.level}
        reasons={walk?.topReasons ?? []}
        loading={walkLoading}
        notReady={walkNotReady}
        hasDog={dog?.dogId != null}
        weather={walk?.weather ?? null}
      />

    </div>
  )
}

export default WalkScoreDetail
