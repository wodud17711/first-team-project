import { useLocation, useNavigate } from "react-router-dom"

// 함수 땡겨오기
import { genderMap, activityMap} from "../../constants/dogConstants"

function DogDetailPage() {

  const navigate = useNavigate()

  // 목록에서 만든 강아지 데이터 받기
  const location = useLocation()
  const dog = location.state

  // 정보 함수
  const basicInfo = [
    {
      label: "생년월일🎂",
      value: `${dog.birthDate} (${dog.ageYears})`,
    },
    {
      label: "견종🐶",
      value: dog.breed.split("(")[0].trim(),
    },
    {
      label: "성별🤍",
      value: `${genderMap[dog.gender]?.text}${genderMap[dog.gender]?.icon}`,
    },
  ]

  const detailInfo = [
    {
      label: "체중🐾",
      value: `${dog.weight}kg`,
    },
    {
      label: "중성화🩺",
      value: dog.isNeutered ? "O" : "X",
    },
  ]

  const lifeInfo = [
    {
      label: "활동량🚶",
      value: activityMap[dog.activityLevel],
    },
    {
      label: "선호 산책 시간🌳",
      value: dog.favorwalktime.join(", "),
    },
    {
      label: "건강특이🩹",
      value: dog.healthNotes || "없음",
    },
  ]

  // 프로필 상세 내용
  const renderSection = (title, data, isLast = false) => (
    <div className={isLast ? "" : "mb-8"}>
      <h3 className="flex items-center text-[18px] font-bold text-sky-800 mb-4">
        <span className="w-1 h-[18px] bg-sky-700 rounded-full mr-2" />
        {title}
      </h3>

      <div className="flex flex-col">
        {data.map((info) => (
          <div
            key={info.label}
            className="flex items-center text-[14px]"
          >
            <span className="font-bold shrink-0">
              {info.label}
            </span>

            <div className="flex-1 border-b border-dashed border-gray-300 mx-3" />

            <span className="shrink-0 text-gray-700">
              {info.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

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

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            반려견 프로필 상세
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              등록된 반려견 프로필의 상세 내용을 확인할 수 있어요.
            </p>
          </div>
        </div>
        
        {/* 목록버튼 */}
        <div className="text-center rounded-xl shadow-sm border">
          <button
            onClick={() => navigate("/dog-profile-list")}
            className="
              px-4 py-2 rounded-xl
              border border-sky-700
              text-sky-700 font-semibold
              hover:bg-sky-700 hover:text-white
              transition
            "
          >
            ← 목록으로
          </button>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>

      {/* 강아지 프로필 상세칸 */}
      <div className="flex flex-col items-center space-y-6">        
        <div className="flex items-stretch gap-6 w-full bg-white rounded-2xl px-8 py-6 shadow-sm border border-gray-100">
          
          {/* 강아지 이미지 */}
          <div className="relative shrink-0">
            <img
              src={dog.profileImageUrl}
              className="w-[350px] h-[470px] rounded-xl object-cover"
            />
            {/* 첫 번째 강아지만 대표 강아지 표시 */}
            {dog.isMain && (
              <span
                className="
                  absolute top-4 left-4
                  px-3 py-1 rounded-full
                  bg-white/80 backdrop-blur
                  text-[14px] font-medium
                "
              >
                ⭐ 대표 강아지
              </span>
            )}
          </div>

          <div className="flex flex-col w-full">
            <h2 className="text-[24px] font-extrabold text-sky-800 mb-4">
              {dog.name}
            </h2>

            {/* 강아지 정보 */}
            <div className="flex-1 bg-gray-50 rounded-xl border p-6">
              {renderSection("📋 기본 정보", basicInfo)}
              {renderSection("🔎 상세 정보", detailInfo)}
              {renderSection("🏡 생활 정보", lifeInfo, true)}
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
