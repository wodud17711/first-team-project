import { useLocation, useNavigate } from "react-router-dom"

function DogDetailPage() {

  const navigate = useNavigate()

  // 목록에서 만든 강아지 데이터 받기
  const location = useLocation()
  const dog = location.state

  // 삭제 클릭 시, 경고창 + 페이지 이동(지금은 실제로 삭제기능 X)
  const handleSubmit = () => {
    const confirmDelete = window.confirm(
      "정말 삭제하시겠습니까?"
    )
    if (confirmDelete) {
      navigate("/dog-profile-list")
    }
  }


  return (
    <div className="p-4">
      {/* 상단 제목 + 프로필 추가 버튼*/}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[28px] font-bold">반려견 프로필 상세</h1>
        <button
          onClick={() => navigate("/dog-profile-list")}
          className="px-4 py-2 bg-brand-500 text-white text-[14px] font-bold rounded-xl"
        >
          목록
        </button>
      </div>
      <div className='w-full h-[1px] bg-brand-400 mb-[30px]'/>

      {/* 강아지 프로필 상세칸 */}
      <div className="flex flex-col items-center space-y-6">        
        <div className="flex items-start w-3/4 bg-white rounded-xl px-[30px] py-[24px] shadow hover:shadow-lg transition">
          
          {/* 강아지 이미지 */}
          <div className="relative shrink-0">
            <img
              src={dog.img}
              className="w-[300px] h-[350px] rounded-xl object-cover"
            />
            {/* 첫 번째 강아지만 대표 강아지 표시 */}
            {dog.isMain && (
              <span
                className="
                  absolute top-3 left-3
                  px-2 py-1 rounded-full
                  bg-white/90 backdrop-blur
                  text-[14px] font-bold
                "
              >
                ⭐ 대표 강아지
              </span>
            )}
          </div>

          {/* 강아지 정보 */}
          <div className="flex flex-col w-full justify-between h-[350px] gap-3 px-4 text-[14px]">
            <h1 className="text-[28px] font-bold">{dog.name}</h1>
            <div className="flex flex-col gap-[14px] text-[14px]">
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">생년월일🎂</span> - {dog.birth}</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">견종🐶</span> - {dog.breed}</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">성별<span
                                                                                                                className={dog.gender === "여아" ? "text-pink-400" : "text-sky-400"}>
                                                                                                                {dog.gender === "여아" ? "🩷" : "🩵"}
                                                                                                              </span>{" "}</span> - {dog.gender}</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">체중🐾</span> - {dog.weight}kg</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">선호 산책 시간🚶</span> - {dog.favorwalktime.join(", ")}</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">건강 특이사항🩺</span> - {dog.health}</p>
              <p className='pb-1 border-b-[1px] border-brand-300'><span className="text-[16px] font-bold">털길이✂️</span> - {dog.hairlength}</p>
            </div>
          </div>



        </div>
      </div>
      
      {/* 수정, 삭제 버튼 */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => navigate("/dog-profile-edit", {state: dog})}
          className="px-3 py-2 w-[90px] bg-brand-500 text-white text-[14px] font-bold rounded-xl"
        >
          수정
        </button>
        <button
            onClick={handleSubmit}
            className="px-3 py-2 w-[90px] bg-danger text-white text-[14px] font-bold rounded-xl"
        >
          삭제
        </button>
      </div>
      
    </div>
    
  )
}

export default DogDetailPage
