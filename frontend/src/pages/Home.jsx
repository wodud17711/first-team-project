// 컴포넌트
import WeatherCard from '../components/WeatherCard'
import WalkScore from '../components/WalkScore'

// 강아지 테스트 사진
import dogImg1 from '../assets/dogImg1.jpg'

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
      <section className="grid grid-cols-[3fr_1fr] gap-4">

        {/* 왼쪽 섹션 - 날씨 + 산책 지수 */}
        <div className='flex flex-col gap-4'>
          {/* 산책 지수 박스*/}
          <div className="bg-white rounded-2xl shadow-sm p-6
            hover:shadow-md hover:scale-[1.01]
            transition-all duration-200 cursor-pointer"
          >
            {/* 산책지수 + 게이지 */}
            <WalkScore />
          </div>

          {/* 날씨 */}
          <WeatherCard />
        </div>
        
        

        {/* 오른쪽 섹션 - 로그인(사용자 인터페이스) */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className='text-[20px] font-bold'>안녕하세요, 00님!</p>

          {/* 강아지 프로필 */}
          <div className='flex bg-white rounded-lg shadow p-2 gap-3'>
            <img src={dogImg1} alt='강아지사진' className='w-20 h-20 rounded-full object-cover'/>
            <div>
              <p className='text-[20px] font-bold'>멍멍이</p>
              <p className='text-[12px]'>🎂 2023/01/01 (3살)</p>
              <p className='text-[12px]'>🐶 리트리버 · 26kg</p>
              <span className='
                px-2 py-[2px]
                rounded-full
                bg-orange-100 text-orange-600
                text-[11px] font-bold
              '>
                활동적
              </span>

            </div>
          </div>

          <div className='flex justify-center items-center gap-4'>
            <p className='text-[14px]'>마이페이지</p>
            <div className='w-px h-[14px] bg-gray-300 flex items-center'/>
            <p className='text-[14px]'>반려견 프로필</p>
          </div>
        </div>
        
      </section>


      {/* (코스 추천) + 코스 미리보기 + 산책 시작 + 오늘의 산책 지수 (이거는 2차긴 한데 일딴 보류)*/}

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
