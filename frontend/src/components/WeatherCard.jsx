// 아이콘 및 일러스트
import locationIcon from '../assets/locationIcon.png'
import weatherTest from '../assets/weatherTest.png'




// - 한글: **Pretendard** (가독성 최강 추천)
// - 영문: System UI 또는 Inter
// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

function WeatherCard() {
    
    const weatherData = [
        { time: "13시", temp: "17℃", icon: weatherTest},
        { time: "14시", temp: "17℃", icon: weatherTest},
        { time: "15시", temp: "16℃", icon: weatherTest},
        { time: "16시", temp: "17℃", icon: weatherTest},
        { time: "17시", temp: "16℃", icon: weatherTest},
    ]

  return (
    // 이거 실제 날씨에 따라 배경도 비오면 비오고 맑으면 구름 솔솔 떠다니고 이런느낌이면 좋을 것 같은디
    <div className="bg-[linear-gradient(to_bottom,#cccccc_0%,#ffffff_70%)] rounded-xl p-4 shadow-sm">

      {/* 사용자 위치 */}
      <div className='flex items-center mb-4 gap-2'>
        <img src={locationIcon} alt="위치아이콘" className='w-5 h-5 object-cover'/>
        <span className="text-[20px] font-bold">무슨시 무슨구</span>
      </div>

      {/* 날씨 및 온도 */}
      <div className='flex items-end gap-1'>
        <img src={weatherTest} alt='날씨아이콘자리' className='w-16 h-16 mr-2 object-cover'/>
        <div>
          <div className='flex items-end gap-2'>
            <span className='text-[42px]'>17.6<span className='text-[32px]'>℃</span></span>
            {/* <span className='text-[14px]'>(체감 20.4℃)</span> */}
            <div className='flex items-baseline ml-3 mt-1 gap-4'>
                <span className='text-[14px]'>최저 16℃</span>
                <span className='text-[14px]'>|</span>
                <span className='text-[14px]'>최고 24℃</span>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-[3fr_1fr] gap-3'>
        {/* 지면온도 - 강아지 산책관련이니까 지면온도를 조금 강조해야됨*/}
        <div className="
          relative
          flex items-center justify-between
          mt-4 p-4
          bg-gradient-to-r from-brand-100 to-brand-50
          rounded-xl shadow
        ">

          {/* 가운데 내용 */}
          <div className="flex-1 flex flex-col items-center">
            
            <p className="absolute left-1/2 top-2 -translate-x-1/2 text-[13px] text-gray-500 font-medium">
              현재 지면온도
            </p>

            <div className="flex items-end gap-2 mt-1">
              <span className="text-[28px] font-bold text-brand-700">32℃</span>

              <span className="
                text-[12px] px-2 py-[2px]
                rounded-full
                bg-green-200 text-green-700
                font-semibold
                mb-1
              ">
                안전
              </span>
            </div>

            <p className="text-[12px] text-gray-500 mt-1"> 대부분 견종이 산책하기 좋아요 </p>

          </div>

          {/* 오른쪽 아이콘 */}
          <div className="
            w-10 h-10
            rounded-full
            bg-white/70
            flex items-center justify-center
            text-[24px]
            ml-3
          ">
            🐾
          </div>

        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-col mt-4 gap-3">

            {/* 체감온도, 습도, 풍속, 자외선, 미세먼지 */}
            <div className="flex gap-3">
                <div className="flex flex-col items-center justify-center w-[80px] h-[60px] bg-white rounded-lg shadow">
                    <p className='text-[12px] text-gray-500'>체감온도</p>
                    <p className='text-[16px] font-bold'>20.4℃</p>
                </div>

                <div className="flex flex-col items-center justify-center w-[80px] h-[60px] bg-white rounded-lg shadow">
                    <p className='text-[12px] text-gray-500'>습도</p>
                    <p className='text-[16px] font-bold'>83%</p>
                </div>

                <div className="flex flex-col items-center justify-center w-[80px] h-[60px] bg-white rounded-lg shadow">
                    <p className='text-[12px] text-gray-500'>풍속</p>
                    <p className='text-[16px] font-bold'>1.9m/s</p>
                </div>

                <div className="flex flex-col items-center justify-center w-[80px] h-[60px] bg-white rounded-lg shadow">
                    <p className='text-[12px] text-gray-500'>자외선</p>
                    <p className='text-[16px] font-bold'>낮음</p>
                </div>

                <div className="flex flex-col items-center justify-center w-[80px] h-[60px] bg-white rounded-lg shadow">
                    <p className='text-[12px] text-gray-500'>미세먼지</p>
                    <p className='text-[16px] font-bold'>좋음</p>
                </div>
            </div>

            {/* 시간별 날씨 */}
            <div className="flex justify-center overflow-x-auto p-3">
                {weatherData.map((weather, index) => (
                    <div
                        key={index}
                        className={`flex flex-col items-center min-w-[45px] px-7 ${
                            index !== weatherData.length - 1
                                ? "border-r border-gray-200"
                                : ""
                        }`}
                    >
                        <span className='text-[14px] text-gray-500'>
                            {weather.time}
                        </span>

                        <img
                            src={weather.icon}
                            alt="날씨아이콘"
                            className="w-7 h-7 object-cover mt-3 my-1"
                        />

                        <span className='text-[14px] font-bold'>
                            {weather.temp}
                        </span>
                    </div>
                ))}
            </div>

        </div>
      </div>

    </div>
  )
}

export default WeatherCard