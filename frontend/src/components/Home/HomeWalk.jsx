import { useNavigate } from 'react-router-dom'


function HomeWalk() {

  const navigate = useNavigate()

  return (
    <section className='grid grid-cols-[1fr_2fr] my-6 bg-brand-100/40 rounded-xl p-6'>
      <div className='flex flex-col'>
        <p className="text-[24px] text-txtcolor-700 font-extrabold">
          반려견과의<br/><span>슬기로운 산책 라이프</span>
        </p>
        <div className="w-14 h-1 bg-brand-500 rounded-full my-4" />
        <span className="text-[14px] text-txtcolor-500">
          산책 기록부터 통계 분석까지,<br/>산책 활동을 쉽고 편하게 체계적으로 관리해보세요.
        </span>
      </div>

      <div className='relative'>
        <div className="flex justify-end gap-4">
          {/* 산책기록 */}
          <div onClick={() => navigate(`/walk`)}
                className="w-[200px] h-[200px] bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-5 cursor-pointer
                          group relative transition-all duration-200 hover:-translate-y-[2px] hover:shadow">
            <p className="text-[20px] text-txtcolor-700 font-extrabold">산책 기록</p>
            <p className="text-[12px] text-txtcolor-500 mt-1">반려견과 함께<br/>오늘의 산책을 시작해볼까요?</p>
            <div className="absolute bottom-5 right-5 w-[80px] h-[80px] rounded-full bg-sky-100
                            scale-0 transition-transform duration-300 group-hover:scale-100"
            />
            <span className="absolute bottom-4 left-5 text-[20px] text-txtcolor-500
                            opacity-0 translate-x-[-6px] transition-all duration-300
                            group-hover:opacity-100 group-hover:translate-x-0"
            >
              →
            </span>
            <img src="/home/WalkDogwalk.png" alt="산책" 
                className="absolute bottom-5 right-5 w-[75px] h-[75px] 
                            opacity-90 transition-transform duration-300 group-hover:scale-110"/>
          </div>

          {/* 산책 캘린더 */}
          <div onClick={() => navigate(`/walk/calendar`)}
                className="w-[200px] h-[200px] bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-4 cursor-pointer
                          group relative transition-all duration-200 hover:-translate-y-[2px] hover:shadow">
            <p className="text-[20px] text-txtcolor-700 font-extrabold">산책 캘린더</p>
            <p className="text-[12px] text-txtcolor-500 mt-1">반려견과 산책한<br/>날들을 돌아볼 수 있어요!</p>
            <div className="absolute bottom-6 right-6 w-[80px] h-[80px] rounded-full bg-brand-100
                            scale-0 transition-transform duration-300 group-hover:scale-100"
            />
            <span className="absolute bottom-4 left-5 text-[20px] text-txtcolor-500
                            opacity-0 translate-x-[-6px] transition-all duration-300
                            group-hover:opacity-100 group-hover:translate-x-0"
            >
              →
            </span>
            <img src="/home/WalkCalendar.png" alt="달력" 
                className="absolute bottom-5 right-5 w-[70px] h-[70px] 
                            opacity-90 transition-transform duration-300 group-hover:scale-110"/>
          </div>

          {/* 주간/월간 리포트 */}
          <div onClick={() => navigate(`/walk/report`)}
                className="w-[200px] h-[200px] bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-4 cursor-pointer
                          group relative transition-all duration-200 hover:-translate-y-[2px] hover:shadow">
            <p className="text-[20px] text-txtcolor-700 font-extrabold">주간/월간 리포트</p>
            <p className="text-[12px] text-txtcolor-500 mt-1">반려견의 산책 패턴을<br/>한눈에 확인해보세요</p>
            <div className="absolute bottom-6 right-6 w-[80px] h-[80px] rounded-full bg-green-100
                            scale-0 transition-transform duration-300 group-hover:scale-100"
            />
            <span className="absolute bottom-4 left-5 text-[20px] text-txtcolor-500
                            opacity-0 translate-x-[-6px] transition-all duration-300
                            group-hover:opacity-100 group-hover:translate-x-0"
            >
              →
            </span>
            <img src="/home/WalkReport.png" alt="리포트" 
                className="absolute bottom-5 right-5 w-[65px] h-[65px] 
                            opacity-90 transition-transform duration-300 group-hover:scale-110"/>
          </div>
        </div>
        {/* <div className="absolute top-7 right-7 w-[632px] h-[200px] rounded-xl bg-brand-100/50 border border-brand-100 -z-10"/> */}
      </div>
    </section>
  )
}

export default HomeWalk
