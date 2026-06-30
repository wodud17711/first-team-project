import { useNavigate } from 'react-router-dom'

// 컴포넌트
import WeatherCard from '../components/WeatherCard'
import WalkScore from '../components/WalkScore/WalkScore'
import WalkScoreHeader from '../components/WalkScore/WalkScoreHeader'

// hooks (실 API 연결)
import { useMe } from '../hooks/useMe'
import { useDogs } from '../hooks/useDogs'
import { useAuth } from '../hooks/useAuth'
import { useWalkScore } from '../hooks/useWalkScore'

// 강아지 기본(폴백) 사진
import dogImg1 from '../assets/dogImg1.jpg'
import { onImgError, HUMAN_FALLBACK } from '../utils/imageFallback'


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

  // 유저패널에 대표 강아지만 보이게
  const mainDog = dogs.find(dog => dog.isMain);

  // 산책지수: 첫 번째 반려견 기준으로 실 API 조회 (dogId 없으면 미호출)
  const firstDogId = dogs[0]?.dogId
  const { data: walk, loading: walkLoading, notReady: walkNotReady } = useWalkScore(firstDogId)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className='relative animate-fadeIn'>
      {/* 상단 배경(산책지수 배경) */}
      <div className="absolute -mt-6 top-0 left-1/2 -translate-x-1/2 w-screen h-[510px] bg-txtcolor-100/55 z-6">
        <div className='bg-brand-100 w-[1920px] h-full object-cover'/>
        {/* <img src='/testimg.png' alt='테스트이미지' className='w-full h-full object-cover'/> */}
        {/* <img src='/testimg2.png' alt='테스트이미지' className='w-full h-full object-cover'/> */}
      </div>

      <div className="relative z-5 flex flex-col gap-6 overflow-x-hidden">
        {/* 헤더 + 유저패널 */}
        <section className="relative flex justify-between mt-6">
          {/* 헤더 */}
          <div>
            <WalkScoreHeader
              title="오늘의 산책지수"
              desc="우리 강아지와 산책하기 좋은 날인지 확인해보세요"
            />
          </div>

          {/* 유저 패널 */}
          <div className="w-[300px] mt-[94px]">
            <div className="flex flex-col bg-black/20 backdrop-blur rounded-xl shadow p-4 overflow-hidden">
              <div className="mb-3">
                <p className="text-[14px] uppercase tracking-wider text-white font-thin">
                  MY PROFILE
                </p>
                <p className="text-[20px] font-bold text-white">
                  오늘도 즐거운 산책 되세요
                </p>
              </div>
              <div className='flex items-center justify-center gap-3'>
                {/* 유저 */}
                <div className="flex-1 flex flex-col p-3 gap-2 bg-white/55 rounded-lg">
                  <p className="mb-[5px] text-[14px] font-bold text-center">보호자</p>
                    <div className='h-[70px] flex justify-center flex flex-col items-center justify-center'>
                      <img src={me?.profileImageUrl || "/userpanel/humanProfile.png"} alt='프로필사진'
                        onError={onImgError(HUMAN_FALLBACK)}
                        className='w-[60px] h-[60px] rounded-[43%] object-cover object-center'/>
                      <p className="mt-[5px] text-[14px] font-bold">{me?.nickname ?? '게스트'}</p>
                    </div>
                  <div className='w-full mt-2 h-px bg-black/20'/>
                  <button onClick={() => navigate("/mypage")} className="text-[14px]">마이페이지</button>
                </div>

                {/* 대표 강아지 */}
                <div className="flex-1 flex flex-col p-3 gap-2 bg-white/55 rounded-lg">
                  <p className="mb-1 text-[14px] font-bold text-center">대표 강아지</p>
      
                  <div className='h-[70px] flex justify-center'>
                    {!mainDog ? (
                      <p className="text-[13px] text-gray-500 py-4 text-center">
                        아직 등록된
                        <br />
                        반려견이 없어요
                      </p>
                        ) : (
                          <div key={mainDog.dogId} className="flex items-center gap-3">    
                            <div className='flex flex-col items-center justify-center'>
                              {mainDog.profileImageUrl ? (
                        <img
                          src={mainDog.profileImageUrl}
                          onError={onImgError()}
                          className="w-[60px] h-[60px] shadow rounded-[43%] object-cover object-center"
                          alt={mainDog.name}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center w-[60px] h-[60px] bg-white shadow rounded-[43%] object-cover object-center">
                          <div className="text-[30px]">🐶</div>
                        </div>
                      )}
                        <p className="mt-[5px] text-[14px] font-bold">{mainDog.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className='w-full mt-2 h-px bg-black/20'/>

                  <button
                    onClick={() => navigate("/dog-profile-list")}
                    className="text-[14px] font-medium"
                  >
                    반려견 프로필
                  </button>
                </div>
              </div>

              

              {/* 로그아웃 */}
              <div className="mt-auto pt-3">
                <div className="flex justify-center items-center gap-4 font-medium
                                rounded-lg p-2 bg-brand-300/80">
                  <div className='flex items-center gap-2'>
                    <img src='/userpanel/logout.png' alt='로그아웃'
                         className='w-[17px] h-[17px]'/>
                    <button onClick={handleLogout} className="text-[14px]">로그아웃</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 산책지수 + 시간별 날씨 */}
        <section className="flex px-4 gap-4 mt-[72px]">
          <div>
            <p className='font-bold text-[24px]'>오늘의 산책지수</p>
            <button className='text-[14px]'>자세히 보기<span className="ml-4 text-lg leading-none">›</span></button>
          </div>
          <WalkScore
            score={walk?.score}
            level={walk?.level}
            reasons={walk?.topReasons ?? []}
            loading={walkLoading}
            notReady={walkNotReady}
            hasDog={firstDogId != null}
            weather={walk?.weather}
          />

          {/* <WeatherCard /> */}
        </section>
        

      


        {/* (코스 추천) + 코스 미리보기 + 산책 시작 + 오늘의 산책 지수 (이거는 2차긴 한데 일딴 보류)*/}

        {/* <section className="bg-gradient-to-br from-brand-50 to-orange-100 rounded-2xl p-6 shadow-sm">
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
        </section> */}

        <section className="px-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">최적 산책 시간</p>
            <p className="text-lg font-semibold mt-1">오후 5시 - 7시</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">이번 주 산책</p>
            <p className="text-lg font-semibold mt-1">3회 · 2시간</p>
          </div>
        </section>

        {/* <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">💡 오늘의 팁</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            오후 시간대에는 지면 온도가 떨어져 산책하기 좋습니다.
            물을 충분히 챙겨가세요.
          </p>
        </section> */}

        <section className="px-4">
          <h1 className='mb-6 text-center text-[30px] text-txtcolor-700 font-extrabold'>커뮤니티</h1>
          <div className='bg-txtcolor-100'>
            <div className='bg-white rounded-xl p-5 shadow-sm'>
              <h3 className="font-semibold mb-3">💡 오늘의 팁</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                오후 시간대에는 지면 온도가 떨어져 산책하기 좋습니다.
                물을 충분히 챙겨가세요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
