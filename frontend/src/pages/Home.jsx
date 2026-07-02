import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// 컴포넌트
import WeatherCard from '../components/WeatherCard'
import WalkScore from '../components/WalkScore/WalkScore'
import WalkScoreHeader from '../components/WalkScore/WalkScoreHeader'

import HomeUserpanel from '../components/Home/HomeUserpanel'
import HomeWalk from '../components/Home/HomeWalk'
import HomeCommunity from '../components/Home/HomeCommunity'

// hooks (실 API 연결)
import { useMe } from '../hooks/useMe'
import { useDogs } from '../hooks/useDogs'
import { useAuth } from '../hooks/useAuth'
import { useWalkScore } from '../hooks/useWalkScore'



function Home() {

  const navigate = useNavigate()
  const { me } = useMe()
  const { dogs } = useDogs()


  // 산책지수: 첫 번째 반려견 기준으로 실 API 조회 (dogId 없으면 미호출)
  const firstDogId = dogs[0]?.dogId
  const { data: walk, loading: walkLoading, notReady: walkNotReady } = useWalkScore(firstDogId)


  return (
    <div className='relative px-4 animate-fadeIn'>
      {/* 상단 배경(산책지수 배경) */}
      <section className="absolute -mt-6 top-0 left-1/2 -translate-x-1/2 w-screen 
                          h-[510px] bg-[#F7F7F7] border-b shadow-sm z-6">
        <img src='/testimg.png' alt='테스트이미지' className='mx-auto w-[1920px] h-full object-cover'/>
        {/* <img src='/testimg2.png' alt='테스트이미지' className='mx-auto w-[1920px] h-full object-cover'/> */}
      </section>

      <div className="relative z-5 flex flex-col gap-6 overflow-x-hidden">
        {/* 헤더 */}
        <section className="relative flex flex-col md:justify-between gap-[68px] mt-6">
          <WalkScoreHeader
            title="오늘의 산책지수"
            desc="우리 강아지와 산책하기 좋은 날인지 확인해보세요"
          />
          {/* 유저 패널 */}
          <HomeUserpanel/>
        </section>

        {/* 산책지수 + 유저패널 */}
        <section className="mb-6 mt-[60px] border border-black">
          <div className='flex gap-4'>
            <div className='flex flex-col mb-4 pb-2 gap-3'>
              <button
                onClick={() => navigate('/walkscore-detail')}
                className="group flex items-center gap-2 text-[30px] font-extrabold text-txtcolor-700"
              >
                산책 컨디션을 확인해볼까요?
                <span className="text-[20px] font-medium transition-transform duration-200 group-hover:translate-x-1">
                  ›
                </span>
              </button>

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
            </div>

            
          </div>
        </section>


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

        {/* <section className="px-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">최적 산책 시간</p>
            <p className="text-lg font-semibold mt-1">오후 5시 - 7시</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">이번 주 산책</p>
            <p className="text-lg font-semibold mt-1">3회 · 2시간</p>
          </div>
        </section> */}

        {/* <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">💡 오늘의 팁</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            오후 시간대에는 지면 온도가 떨어져 산책하기 좋습니다.
            물을 충분히 챙겨가세요.
          </p>
        </section> */}

        {/* 산책 페이지들 */}
        <HomeWalk/>

        {/* 커뮤니티 */}
        <HomeCommunity/>
      </div>
    </div>
  )
}

export default Home
