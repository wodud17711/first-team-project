// 아이콘 및 일러스트
import locationIcon from '../assets/locationIcon.png'
import weatherTest from '../assets/weatherTest.png'

// 컴포넌트
import WalkScore from '../components/WalkScore'

// 일단 홈화면 첫 줄부터 만들어 본 다음 로그인, 회원가입 페이지 작성
// 폰트 적용은 나중에, 일단 배치부터
// 색상 아직 미정, 일단 초록색 넣어본 것
// - 한글: **Pretendard** (가독성 최강 추천)
// - 영문: System UI 또는 Inter
// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48
// gap-1 > 4px, gap-2 > 8px ...

function Home() {
  return (
    <div className="space-y-6">

      {/* 최상단 */}
      <section className="grid grid-cols-[2fr_1fr] gap-3">

        {/* 왼쪽 섹션 */}
        {/* (코스 추천) + 코스 미리보기 + 산책 시작 + 오늘의 산책 지수 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className='text-[24px] font-bold'>안녕하세요, 000님!</p>

          <div className='flex'>

            <div className='w-[200px] h-[323px] flex flex-col items-center bg-white rounded-lg shadow'>
              <p className="text-[18px] font-bold mt-5">오늘의 산책지수</p>
              <div className='mt-5'>
                <WalkScore/>
              </div>
            </div>
            
            <div className=''>
              산책 코스 추천
            </div>

          </div>

          

        </div>

        {/* 오른쪽 섹션 - 날씨 + 산책적합도 */}
        <div className="bg-[linear-gradient(to_bottom,#cccccc_0%,#ffffff_70%)] rounded-xl p-4 shadow-sm">

          <div className='flex items-center mb-4 gap-2'>
            <img src={locationIcon} alt="위치아이콘" className='w-5 h-5 object-cover'/>
            <span className="text-[20px] font-bold">무슨시 무슨구</span>
          </div>

          <div className='flex items-end gap-1'>
            <img src={weatherTest} alt='날씨아이콘자리' className='w-20 h-20 mr-2 object-cover'/>
            <div>
              <div className='flex items-end gap-2'>
                <span className='text-[32px]'>17.6℃</span>
                <span className='text-[14px]'>(체감 20.4℃)</span>
              </div>
              <div className='flex items-baseline ml-3 mt-1 gap-4'>
                <span className='text-[14px]'>최저 16℃</span>
                <span className='text-[14px]'>|</span>
                <span className='text-[14px]'>최고 24℃</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2 bg-[#E7FBBE] rounded-lg shadow">
            <p className="text-[12px] text-gray-600">
              지면온도 <span className="font-bold text-[#86D293]">00℃</span> (안전)
            </p>
          </div>

          <div className="flex mt-2 gap-3">
            <div className="flex flex-col items-center justify-center w-16 h-[60px] bg-white rounded-lg shadow">
              <p className='text-[12px] text-gray-500'>습도</p>              
              <p className='text-[16px] font-bold'>83%</p>              
            </div>
            <div className="flex flex-col items-center justify-center w-16 h-[60px] bg-white rounded-lg shadow">
              <p className='text-[12px] text-gray-500'>풍속</p>
              <p className='text-[16px] font-bold'>1.9m/s</p>  
            </div>
            <div className="flex flex-col items-center justify-center w-16 h-[60px] bg-white rounded-lg shadow">
              <p className='text-[12px] text-gray-500'>자외선</p>
              <p className='text-[16px] font-bold'>낮음</p>
            </div>
            <div className="flex flex-col items-center justify-center w-16 h-[60px] bg-white rounded-lg shadow">
              <p className='text-[12px] text-gray-500'>미세먼지</p>
              <p className='text-[16px] font-bold'>좋음</p>
            </div>
          </div>

          <div className='mt-4 h-[100px] bg-white rounded-lg shadow'>
            여기는 1시간 당 날씨 변화 들어올 공간
          </div>


          
          
      
          
          {/* <p>어제보다 2℃ 높아요</p> */}
            
        </div>

        

      </section>


      <section className="bg-gradient-to-br from-brand-50 to-orange-100 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-brand-600 font-medium mb-1">오늘의 산책</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          산책하기 좋은 날씨예요 🌤
        </h2>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-bold text-brand-600">85</span>
          <span className="text-gray-600">/ 100점</span>
        </div>
        <p className="text-sm text-gray-700 mt-2">
          지면 온도 22°C · 습도 55% · 미세먼지 보통
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
  )
}

export default Home
