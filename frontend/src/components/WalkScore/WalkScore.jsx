

// 아이콘 및 일러스트
import locationIcon from '../../assets/locationIcon.png'
import weatherTest from '../../assets/weatherTest.png'

// WalkScore 요소
import WalkScoreHeader from './WalkScoreHeader'
import WalkScoreCard from './WalkScoreCard'
import { buildWeatherItems } from './weatherDisplay'


// 날씨요소 코드 줄이는 컴포넌트
function WeatherItem({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center px-[24px]">

      <p className="text-[12px] text-gray-400">
        {label}
      </p>

      <div className="h-[35px] flex items-center justify-center">
        {icon ? (
          <img
            src={icon}
            className="w-[20px] h-[20px] object-contain"
          />
        ) : (
          <p className="text-[16px] font-bold">
            {value}
          </p>
        )}
      </div>

    </div>
  )
}

function getWalkTip(score) {
  if (score >= 70) {
    return "오늘은 산책하기 최적의 날이에요. 40~90분 정도 충분히 활동해도 좋아요.";
  }
  if (score >= 40) {
    return "짧은 산책은 괜찮아요. 더운 시간대는 피하고 20~40분 정도 추천해요.";
  }
  return "실내 활동을 추천해요. 외출 시에는 짧은 배변 산책만 하고 빠르게 들어오세요.";
}

// 날씨 적합도 점수(막대 그래프)
// score: BE /api/walk/score 실값(0~100). 없을 때(미등록/로딩/날씨준비중/오류)는
//        숫자 대신 안내 문구를 보여준다.
// level: BE 등급 정본('안전'|'주의'|'위험'). 점수 임계와 어긋나는 치명요인
//        override(예: 미세먼지 매우나쁨 70점이지만 '주의')를 그대로 반영하므로,
//        등급 카테고리는 score 가 아니라 level 로 분기한다.
function WalkScore(props) {
  const {
    score,
    level,
    reasons = [],
    loading = false,
    notReady = false,
    hasDog = true,
    weather = null,
  } = props

  const ready = typeof score === 'number'
  const clamped = ready ? Math.max(0, Math.min(score, 100)) : 0

  // 등급별 표시 메타
  const LEVEL_META = {
    '안전': {
      color: "bg-success",
      label: "안전해요",
      title: "산책하기 좋은 날이에요 ☀️",
      desc: "대부분 견종이 편안하게 산책할 수 있어요"
    },
    '주의': {
      color: "bg-warning",
      label: "주의가 필요해요",
      title: "짧은 산책을 추천드려요 🌥️",
      desc: "더위에 약한 반려견은 주의가 필요해요"
    },
    '위험': {
      color: "bg-danger",
      label: "위험해요",
      title: "산책을 되도록 피해주세요 🌧️",
      desc: "지면온도와 날씨 상태가 산책하기 위험해요"
    }
  }

  // level 우선, 없으면 점수 임계로 폴백.
  const metaByScore = (s) =>
    s >= 70 ? LEVEL_META['안전'] : s >= 40 ? LEVEL_META['주의'] : LEVEL_META['위험']

  let color, label, title, desc, scoreText

  if (!hasDog) {
    color="bg-gray-300"; label="–"; scoreText="--";
    title="반려견을 먼저 등록해 주세요";
    desc="반려견을 등록하면 맞춤 산책지수를 알려드려요";
  } else if (loading) {
    color="bg-gray-300"; label="측정 중"; scoreText="--";
    title="산책지수를 측정하고 있어요";
    desc="잠시만 기다려 주세요";
  } else if (notReady) {
    color="bg-gray-300"; label="준비 중"; scoreText="--";
    title="날씨 데이터를 준비하고 있어요 🛰️";
    desc="날씨 정보가 모이면 산책지수를 보여드려요";
  } else if (!ready) {
    color="bg-gray-300"; label="–"; scoreText="--";
    title="산책지수를 불러오지 못했어요";
    desc="잠시 후 다시 시도해 주세요";
  } else {
    const meta = LEVEL_META[level] ?? metaByScore(clamped)
    color = meta.color
    label = meta.label
    title = meta.title
    scoreText = clamped
    desc = reasons[0] ?? meta.desc
  }

  // BE /walk/score 응답의 weather 블록(실측 스냅샷)으로 카드 날씨 줄을 채운다.
  // 등급 라벨 변환·null 방어는 weatherDisplay 의 순수 함수가 담당.
  // 날씨 아이콘(sky)은 스냅샷에 데이터가 없어 현재는 고정 이미지를 유지한다.
  const weatherItems = buildWeatherItems(weather, weatherTest)

  return (
    <div className="flex flex-col">
      {/* 카드 */}
      <WalkScoreCard
        scoreText={scoreText}
        label={label}
        color={color}
        clamped={clamped}
        weatherItems={weatherItems}
        tipText={ready ? getWalkTip(clamped) : null}
      />
    </div>
  )
}

export default WalkScore


