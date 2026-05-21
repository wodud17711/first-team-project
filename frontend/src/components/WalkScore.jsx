
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


 // 날씨 적합도 점수(원모양) - 홈에 들어감
function WalkScore() {

    const score = 91   // 현재 산책 점수 (나중에 실제 결과 도출로 나올 자리), 점수에 맞게 점수%만큼 원이 참
    const radius = 75  // 원 크기
    const stroke = 15  // 원 두께

    const normalizedRadius = radius - stroke / 2  // 실제 원 반지름 계산
    const circumference = normalizedRadius * 2 * Math.PI  // 원 둘레 계산

    const strokeDashoffset = circumference - (score/100) * circumference  // 진행률 계산


  return (
    <div className="relative w-[150px] h-[150px] flex items-center justify-center">

        <svg height={radius*2} width={radius*2} className="rotate-[-90deg]">
            {/* 배경 원 */}
            <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} 
                    r={normalizedRadius} cx={radius} cy={radius}/>

            {/* 진행률 원 */}
            <circle stroke="#7BE27B" fill="transparent" strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={circumference + ' ' + circumference}
                    strokeDashoffset={strokeDashoffset}
                    r={normalizedRadius} cx={radius} cy={radius}/>
        </svg>

        {/* 원 안 가운데 텍스트 */}
        <div className="absolute flex flex-col items-center">
            <h1 className="text-[32px] font-bold leading-none">91점</h1>
            <span className="text-[20px] text-gray-500">/100</span>
        </div>

    </div>
  )
}

export default WalkScore