
// 폰트 적용은 나중에, 일단 배치부터
// 색상 아직 미정, 일단 초록색 넣어본 것
// - 한글: **Pretendard** (가독성 최강 추천)
// - 영문: System UI 또는 Inter
// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48
// gap-1 > 4px, gap-2 > 8px ...

// 나중에 실제 백엔드에서 데이터 받고 점수 내야할 때
// function WalkScore() { const score = 91 ~  << 현재 이 부분을 아래처럼 변경
// function WalkScore({score}) { ~ <h1>{score}점</h1>} 

// < 점수 계산 함수 만들 때 아래 참고 >
// 1. 온도 - 온도 높으면 더움
// 2. 지면온도 - 강쥐 발바닥 화상위험 (제일 중요)
// - 안전: ~30도 이하, 대부분 견종 산책 가능 
// - 주의: 30~35도, 소형견과 단두종(퍼그, 포메) 주의
// - 위험: 35~45도, 발바닥 화상 위험 시작 및 짧은 산책 권장 
// - 매우위험: 45도이상, 5~10분 내 화상 가능, 산책 금지
// 3. 습도 - 더위 체감 증가(강아지는 땀을 발바닥 젤리랑 코, 귀, 헐떡이는 걸로 체온 조절)
// 4. 미세먼지 - 호흡기에 안좋음
// 5. 견종 - 소형견, 이중모견(추운 지역 출신 견종들)들은 더위에 매우 취약
// 말고 추가할 것 있으면 팀원들과 상의

// 그리고 따로 calculateWalkScore.js 파일 만들어서 아래 작성.. 이게 하는 일은 조건에 따라 점수 내는 아래 함수 써주기(감점 점수는 그냥 예시로 넣은 것)
// function calculateWalkScore({
//     temp,
//     groundTemp,
//     humidity,
//     dust,
//     breed
// }){
//     let score = 100

//     // 지면온도 높으면 감점
//     if (groundTemp >= 45){
//         score -= 50
//     } else if (groundTemp >= 40){
//                score -= 30
//     } else if (groundTemp >=35){
//                score -= 15
//     }
//     // 습도 높으면 감점
//     if (humidity > 80){
//         score -= 10
//     }
//     // 견종+온도에 따라 감점(이것도 견종별 위험도 breedRules.js 파일 따로 만들어줘야 함..)
//     if (breed ==='포메라니안' && temp > 28){
//         score -= 20
//     }
//     // 미세먼지에 따라 감점(이것도 airQualityRules.js 파일 따로 만들기)
//     if (dust === '나쁨')
//         score -= 20
//     return Math.max(0, score) // 점수 계산했을 때 음수가 나오지 않고 최저점이 0이 되도록
// }

// const score = calculateWalkScore()

// 아이콘 및 일러스트
import locationIcon from '../../assets/locationIcon.png'
import weatherTest from '../../assets/weatherTest.png'

// WalkScore 요소
import WalkScoreHeader from './WalkScoreHeader'
import WalkScoreCard from './WalkScoreCard'


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
  } = props

  const ready = typeof score === 'number'
  const clamped = ready ? Math.max(0, Math.min(score, 100)) : 0

  // 등급별 표시 메타 (색·문구는 디자인 영역 — 정선혜 확정).
  const LEVEL_META = {
    '안전': {
      color: "bg-success",
      label: "안전해요🟢",
      title: "산책하기 좋은 날이에요 ☀️",
      desc: "대부분 견종이 편안하게 산책할 수 있어요"
    },
    '주의': {
      color: "bg-warning",
      label: "주의가 필요해요🟡",
      title: "짧은 산책을 추천드려요 🌥️",
      desc: "더위에 약한 반려견은 주의가 필요해요"
    },
    '위험': {
      color: "bg-danger",
      label: "위험해요🔴",
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

  const weatherItems = [
    { label:'날씨', icon: weatherTest },
    { label:'기온', value:'17℃' },
    { label:'지면온도', value:'32℃' },
    { label:'습도', value:'83%' },
    { label:'미세먼지', value:'좋음' },
    { label:'바람', value:'약함' },
    { label:'자외선', value:'낮음' },
  ]

  return (
    <div className="flex flex-col">
    
      {/* 헤더 */}
      {/* <WalkScoreHeader title={title} desc={desc} /> */}

      {/* spacer */}
      {/* <div className="h-[208px]" /> */}

      {/* 카드 */}
      <WalkScoreCard
        scoreText={scoreText}
        label={label}
        color={color}
        clamped={clamped}
        weatherItems={weatherItems}
      />

    </div>
  )
}

export default WalkScore


