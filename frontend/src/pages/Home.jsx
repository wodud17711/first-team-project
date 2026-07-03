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

  // 배너 상단 멘트
  const LEVEL_META = {
    '안전': {
      title: "산책하기 좋은 날이에요 ☀️",
      desc: "대부분 견종이 편안하게 산책할 수 있어요"
    },
    '주의': {
      title: "짧은 산책을 추천드려요 🌥️",
      desc: "더위에 약한 반려견은 주의가 필요해요"
    },
    '위험': {
      title: "산책을 되도록 피해주세요 🌧️",
      desc: "지면온도와 날씨 상태가 위험해요"
    }
  }

  // score 0 도 유효한 점수(위험)라 truthy 검사 대신 null 검사.
  // hasDog=false 면 조회 자체를 안 하므로 로딩 문구 대신 등록 안내를 보여준다.
  function getMeta(score, level, hasDog) {
    if (!hasDog) return {
      title: "오늘의 산책지수",
      desc: "반려견을 등록하면 맞춤 산책지수를 알려드려요"
    }

    if (score == null) return {
      title: "산책지수를 불러오는 중",
      desc: "잠시만 기다려 주세요"
    }

    if (level && LEVEL_META[level]) return LEVEL_META[level]

    if (score >= 70) return LEVEL_META['안전']
    if (score >= 40) return LEVEL_META['주의']
    return LEVEL_META['위험']
  }

  // 산책지수: 첫 번째 반려견 기준으로 실 API 조회 (dogId 없으면 미호출)
  const firstDogId = dogs[0]?.dogId
  const { data: walk, loading: walkLoading, notReady: walkNotReady } = useWalkScore(firstDogId)

  const meta = getMeta(walk?.score, walk?.level, !!firstDogId)

  return (
    <div className='relative px-4 animate-fadeIn'>
      {/* 배너 — lg 미만은 일러스트가 잘리지 않게 원본 비율(1920×510)로 축소해 하단 정렬,
          lg 이상은 기존처럼 1920px 고정폭 + cover */}
      <section className="absolute -mt-6 top-0 left-1/2 -translate-x-1/2 w-screen h-[390px] sm:h-[440px] lg:h-[510px] bg-[#F7F7F7] border-b shadow-sm z-6">
        {/* 모바일(<sm)은 양옆 여백(구름)을 잘라 사람+강아지를 크게(cover, 가로 62% 지점 기준),
            sm~lg 는 전체 비율 유지(contain), lg 이상은 기존 1920px cover */}
        <img src='/testimg.png' alt='산책 일러스트' className='absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[200px] object-cover object-[62%_100%] sm:h-auto sm:object-contain lg:w-[1920px] lg:h-full lg:object-cover'/>
        {/* <img src='/testimg2.png' alt='테스트이미지' className='mx-auto w-[1920px] h-full object-cover'/> */}
      </section>

      <div className="relative z-5 flex flex-col gap-6 overflow-x-hidden">
        {/* 헤더 */}
        {/* 모바일은 유저 패널이 배너 일러스트(강아지)를 가리지 않게 간격을 키워 배너 아래로 내린다 */}
        <section className="relative flex flex-col md:justify-between gap-[190px] sm:gap-[68px] mt-6">
          <WalkScoreHeader
            title={meta.title}
            desc={meta.desc}
          />
          {/* 유저 패널 */}
          <HomeUserpanel/>
        </section>

        {/* 산책지수 */}
        <section className="mb-6 mt-[65px]">
            <div className='flex flex-col gap-3'>
              <button
                onClick={() => navigate('/walkscore-detail')}
                className="group flex items-center gap-2 text-[30px] font-extrabold text-txtcolor-700"
              >
                오늘의 산책지수를 확인해볼까요?
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
        </section>

        {/* 산책 페이지들 */}
        <HomeWalk/>

        {/* 커뮤니티 */}
        <HomeCommunity/>
      </div>
    </div>
  )
}

export default Home
