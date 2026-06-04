import { useNavigate } from 'react-router-dom'

// 컴포넌트
import WeatherCard from '../components/WeatherCard'
import WalkScore from '../components/WalkScore'

// hooks (실 API 연결)
import { useMe } from '../hooks/useMe'
import { useDogs } from '../hooks/useDogs'
import { useAuth } from '../hooks/useAuth'
import { useWalkScore } from '../hooks/useWalkScore'

// 강아지 기본(폴백) 사진
import dogImg1 from '../assets/dogImg1.jpg'


// 일단 홈화면 첫 줄부터 만들어 본 다음 로그인, 회원가입 페이지 작성
// 폰트 적용은 나중에, 일단 배치부터
// 색상 아직 미정, 일단 초록색 넣어본 것
// - 한글: **Pretendard** (가독성 최강 추천)
// - 영문: System UI 또는 Inter
// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48
// gap-1 > 4px, gap-2 > 8px ...

function Home() {

  const navigate = useNavigate()
  const { me } = useMe()
  const { dogs } = useDogs()
  const { logout } = useAuth()

  // 산책지수: 첫 번째 반려견 기준으로 실 API 조회 (dogId 없으면 미호출)
  const firstDogId = dogs[0]?.dogId
  const { data: walk, loading: walkLoading, notReady: walkNotReady } = useWalkScore(firstDogId)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className='relative'>
      {/* 상단 배경(산책지수 배경) */}
      <div className="absolute -mt-6 top-0 left-1/2 -translate-x-1/2 w-screen h-[500px] bg-brand-200 z-0" />

      
      <div className="relative z-5 flex flex-col gap-6 overflow-x-hidden">
        {/* 상단 콘텐츠 */}
        <section className="
          w-full mx-auto mt-6
          grid grid-cols-[2.5fr_1fr] gap-4
        ">
          {/* 왼쪽 콘텐츠 - 산책지수 + 날씨 */}
          <div className='flex flex-col gap-4'>
            <WalkScore
              score={walk?.score}
              reasons={walk?.topReasons ?? []}
              loading={walkLoading}
              notReady={walkNotReady}
              hasDog={firstDogId != null}
            />
            <WeatherCard />
          </div>

          {/* 오른쪽 콘텐츠 - 로그인(유저 패널) */}
          <div className="mt-[225px] flex flex-col bg-white rounded-xl shadow p-4">
            <p className='text-[20px] font-bold'>안녕하세요, {me?.nickname ?? '게스트'}님!</p>

            {/* 강아지 프로필 (useDogs 실 API) */}
            <div className='flex flex-col mt-2 gap-2'>
              {dogs.length === 0 ? (
                <p className='text-[13px] text-gray-500 py-4 text-center'>
                  아직 등록된 반려견이 없어요
                </p>
              ) : (
                dogs.map((dog) => (
                  <div key={dog.dogId} className='flex items-center bg-brand-100 rounded-lg shadow p-3 gap-3'>
                    <img
                      src={dog.profileImageUrl || dogImg1}
                      alt='강아지사진'
                      className='w-[85px] h-[85px] border-4 border-white shadow rounded-full object-cover'
                    />
                    <div>
                      <p className='text-[20px] font-bold'>{dog.name}</p>
                      <p className='text-[12px]'>
                        🎂 {dog.birthDate ?? '생일 미등록'}
                        {dog.age != null && ` (${dog.age}살)`}
                      </p>
                      <p className='text-[12px]'>🐶 {dog.breed?.nameKr ?? '믹스'} · {dog.weight}kg</p>
                      {dog.activityLevel && (
                        <div className='flex gap-1 mt-1'>
                          <span className='
                          px-2 py-[2px]
                          rounded-full
                          bg-sun-200 text-sun-700
                          text-[11px] font-bold
                          '>
                            활동량 {dog.activityLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className='mt-auto'>
              <div className='flex justify-center items-center gap-4'>
                <p className='text-[14px]'>마이페이지</p>
                <div className='w-px h-[14px] bg-gray-300 flex items-center'/>
                <button onClick={() => navigate("/dog-profile-list")}
                        className='text-[14px]'>반려견 프로필</button>
              </div>
              <button onClick={handleLogout}
                      className='w-full p-2 bg-brand-500 rounded-xl'>로그아웃</button>
            </div>
            
          </div>
          
        </section>

      


        {/* (코스 추천) + 코스 미리보기 + 산책 시작 + 오늘의 산책 지수 (이거는 2차긴 한데 일딴 보류)*/}

        <section className="bg-gradient-to-br from-brand-50 to-orange-100 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-brand-600 font-medium mb-1">오늘의 산책</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            오늘의 산책지수
          </h2>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-bold text-brand-600">{walk?.score ?? '--'}</span>
            <span className="text-gray-600">/ 100점</span>
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {walk?.topReasons?.[0]
              ?? (walkNotReady ? '날씨 데이터를 준비하고 있어요' : '산책하기 좋은 날을 알려드릴게요')}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">최적 산책 시간</p>
            <p className="text-lg font-semibold mt-1">오후 5시 - 7시</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">이번 주 산책</p>
            <p className="text-lg font-semibold mt-1">3회 · 2시간</p>
          </div>
        </section>

        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">💡 오늘의 팁</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            오후 시간대에는 지면 온도가 떨어져 산책하기 좋습니다.
            물을 충분히 챙겨가세요.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Home
