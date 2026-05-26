
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
import locationIcon from '../assets/locationIcon.png'
import weatherTest from '../assets/weatherTest.png'


// 날씨 적합도 점수(막대 그래프)
function WalkScore({ score = 77 }) {

  // 점수 0~100으로 제한
  score = Math.max(0, Math.min(score, 100));

  const getScoreMeta = (score) => {
    if (score >= 70) {
      return {
        color: "bg-success",
        label: "안전해요🟢",
        title: "산책하기 좋은 날이에요 ☀️",
        desc: "대부분 견종이 편안하게 산책할 수 있어요"
      };
    }

    if (score >= 40) {
      return {
        color: "bg-warning",
        label: "주의가 필요해요🟡",
        title: "짧은 산책을 추천드려요 🌥️",
        desc: "더위에 약한 반려견은 주의가 필요해요"
      };
    }

    return {
      color: "bg-danger",
      label: "위험해요🔴",
      title: "산책을 되도록 피해주세요 🌧️",
      desc: "지면온도와 날씨 상태가 산책하기 위험해요"
    };
  };

  const { color, label, title, desc } = getScoreMeta(score);

  return (
    <div className="w-full px-[180px]">

      {/* 상단 */}
      <div className="flex flex-col items-start justify-between">
        {/* 사용자 위치 */}
        <div className='flex items-center gap-2'>
          <img src={locationIcon} alt="위치아이콘" className='w-4 h-4 object-cover'/>
          <span className="text-[14px] text-txtcolor-500 font-bold">무슨시 무슨구</span>
        </div>
        {/* 점수별 멘트 */}
        <div className='mt-2'>
          <h2 className="text-[32px] text-txtcolor-900 font-bold mt-1 tracking-[-0.02em]">
            {title}
          </h2>
          <p className="text-[14px] text-txtcolor-500 ml-1 mt-1">
            {desc}
          </p>
        </div>
      </div>

      {/* 오늘의 산책지수 */}
      <div className="mt-5 bg-white rounded-xl p-3 shadow-sm w-full">
        
        {/* 제목 */}
        <span className="
          inline-flex items-center justify-center
          px-3 py-1 mb-5 rounded-full
          text-[13px] font-bold text-brand-700 bg-brand-100
        ">
          오늘의 산책지수
        </span>

        {/* 아래 영역 */}
        <div className="flex items-start gap-6">

          {/* 왼쪽 - 점수 */}
          <div className="
            flex flex-col items-center
            min-w-fit text-center whitespace-nowrap
          ">
            <div className="flex items-end gap-1">
              <span className="text-[48px] font-bold leading-none">
                {score}
              </span>
              <span className="text-[18px] text-gray-500 -mb-[2px]">
                /100
              </span>
            </div>

            <span className="
              mt-1
              text-[15px] font-bold text-green-600
            ">
              {label}
            </span>

          </div>

          {/* 오른쪽 */}
          <div className="flex-1">

            {/* 게이지 */}
            <div className="
              h-[14px]
              bg-gray-200
              rounded-full
              overflow-hidden
            ">
              <div
                className={`
                  h-full rounded-full
                  transition-all duration-500
                  ${color}
                `}
                style={{ width: `${score}%` }}
              />
            </div>

            {/* 날씨 요소 */}
            <div className="flex gap-3 mt-4">

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>날씨</p>
                <img src={weatherTest} alt='날씨아이콘자리' className='w-4 h-4 mr-2 object-cover'/>
                <p className='text-[16px] font-bold'>맑음</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>기온</p>
                <p className='text-[16px] font-bold'>17.6℃</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>지면온도</p>
                <p className='text-[16px] font-bold'>32℃</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>습도</p>
                <p className='text-[16px] font-bold'>83%</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>미세먼지</p>
                <p className='text-[16px] font-bold'>좋음</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>바람</p>
                <p className='text-[16px] font-bold'>약함</p>
              </div>

              <div className="
                flex flex-col items-center justify-center
                w-[82px] h-[68px]
                bg-white rounded-2xl shadow-sm
              ">
                <p className='text-[12px] text-gray-400'>자외선</p>
                <p className='text-[16px] font-bold'>낮음</p>
              </div>
              
            </div>

          </div>

        </div>

      </div>
      
    </div>
  );
}

export default WalkScore


