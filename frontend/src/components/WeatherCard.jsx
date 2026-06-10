// 아이콘 및 일러스트
import weatherTest from '../assets/weatherTest.png'
import timeIcon from '../assets/timeIcon.png'




// - 한글: **Pretendard** (가독성 최강 추천)
// - 영문: System UI 또는 Inter
// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

function WeatherCard() {
    
    const weatherData = [
        { time: "13시", score: "67점", label: "보통", icon: weatherTest},
        { time: "14시", score: "74점", label: "좋음", icon: weatherTest},
        { time: "15시", score: "79점", label: "좋음", icon: weatherTest},
        { time: "16시", score: "92점", label: "매우 좋음", icon: weatherTest},
        { time: "17시", score: "81점", label: "좋음", icon: weatherTest},
    ]

  return (
    
    <div className="bg-white rounded-xl p-4 shadow">

      {/* 제목 */}
      <div className='flex items-center gap-2'>
        <img src={timeIcon} alt="시간아이콘" className="w-5 h-5 object-cover"/>
        <p className='text-[16px] text-txtcolor-900 font-bold'>시간대별 산책 추천</p>
      </div>

      <div className='mt-2 h-px bg-txtcolor-100'/>

      
      <div className="flex flex-col mt-2 gap-3">
          {/* 시간별 날씨 */}
          <div className="flex justify-center overflow-x-auto gap-[10px] py-2">
              {weatherData.map((weather, index) => (
                  <div
                      key={index}
                      className="flex flex-col items-center min-w-[110px] px-7">
                      <span className='text-[14px] text-txtcolor-400'>
                          {weather.time}
                      </span>
                      <img
                          src={weather.icon}
                          alt="날씨아이콘"
                          className="w-7 h-7 object-cover mt-3 my-1"
                      />
                      <span className='text-[14px] text-txtcolor-900 font-bold'>
                          {weather.score}
                      </span>
                      <span className='text-[14px] text-txtcolor-400'>
                          {weather.label}
                      </span>
                  </div>
              ))}
          </div>

          {/* 산책시간 추천 */}
          <div className="
            px-4 py-1.5
            rounded-full whitespace-nowrap
            bg-sky-100 text-sky-700 text-[12px] font-bold
          ">
            오늘은 오후 4시 ~ 6시 산책을 추천드려요!
          </div>

      </div>
    </div>

  )
}

export default WeatherCard