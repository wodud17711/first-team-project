import { useLocation, useNavigate } from "react-router-dom"

// 강아지 기본(폴백) 사진
import dogImg1 from '../../assets/dogImg1.jpg'

// 함수 땡겨오기
import { genderMap, activityMap} from "../../constants/dogConstants"

function DogDetailPage() {

  const navigate = useNavigate()

  // 목록에서 만든 강아지 데이터 받기
  const location = useLocation()
 
  const state = location.state

  // 👉 dog 없으면 기본값으로 "빈 객체" 처리
  const dog = state?.dog ?? null
  const index = state?.index ?? 0

  // 👉 로딩/빈 데이터 상태 UI
  if (!dog) {
    return (
      <div className="p-6 text-center text-gray-500">
        선택된 강아지 정보에 문제가 생겼어요! 🐶
        <div className="mt-4">
          <button
            onClick={() => navigate("/dog-profile-list")}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl"
          >
            목록으로
          </button>
        </div>
      </div>
    )
  }

  // 강아지 나이 계산 함수
  const getAge = (birthDate) => {
    if (!birthDate) return "정보 없음"

    const today = new Date()
    const birth = new Date(birthDate)

    let age = today.getFullYear() - birth.getFullYear()

    const m = today.getMonth() - birth.getMonth()

    // 아직 생일 안 지났으면 -1
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age}살`
  }


  // 정보 함수
  const basicInfo = [
    {
      label: "생년월일🎂",
      value: `${dog.birthDate?.replaceAll("-", ".") ?? "정보 없음"} (${getAge(dog.birthDate)})`,
    },
    {
      label: "견종🐶",
      value: dog.breed?.nameKr?.split("(")?.[0]?.trim() ?? "정보 없음"
    },
    {
      label: "성별🤍",
      value: genderMap?.[dog.gender]?.text ?? "정보 없음",
    },
  ]

  const detailInfo = [
    {
      label: "체중🐾",
      value: dog.weight ? `${dog.weight}kg` : "정보 없음",
    },
    {
      label: "중성화🩺",
      value: dog.isNeutered !== undefined ? (dog.isNeutered ? "O" : "X") : "정보 없음",
    },
  ]

  const lifeInfo = [
    {
      label: "활동량🚶",
      value: activityMap?.[dog.activityLevel] ?? "정보 없음",
    },
    {
      label: "선호 산책 시간🌳",
      value: Array.isArray(dog.favorWalkTime) && dog.favorWalkTime.length > 0
              ? dog.favorWalkTime.join(", ")
              : "정보 없음",
    },
    {
      label: "건강 특이사항🩹",
      value: dog.healthNotes || "없음",
    },
  ]

  // 프로필 상세 내용
  const renderSection = (title, data) => (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4">
      <h3 className="flex items-center text-[18px] font-semibold text-sky-900 mb-4">
        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
        {title}
      </h3>

      <div className="flex flex-col gap-3">
      {data.map((info) => (
        <div key={info.label} className="flex items-center text-[14px]">

          <span className="font-semibold shrink-0 text-gray-700">
            {info.label}
          </span>

          <div className="flex-1 mx-3 border-b border-dashed border-gray-400" />

          <span className="text-gray-600 shrink-0">
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
    <div className="p-4 animate-fadeIn">

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
        <div className="flex items-stretch gap-6 w-full">
          
          {/* 강아지 이미지 */}
          <div className="relative shrink-0">
            <img
              src={dog.profileImageUrl || dogImg1}
              className="w-[350px] h-[470px] rounded-xl object-cover shadow-md"
            />
          </div>

          {/* 강아지 정보 */}
          <div className="flex flex-col w-full">
            <div className="flex-1 bg-white rounded-xl border shadow-sm px-6 py-4">
              <div className="flex items-center mb-3 ml-1 gap-3">
                <h2 className="text-[36px] font-extrabold text-sky-900">
                  {dog.name}
                </h2>
                {index === 0 && (
                  <span className="px-2 py-1 text-[12px] rounded-full bg-sky-200/80 text-sky-900 font-semibold">
                    대표
                  </span>
                )}
              </div>
                
              <div className="grid grid-cols-2 gap-4">
                {renderSection("📋 기본 정보", basicInfo)}
                {renderSection("🔎 상세 정보", detailInfo)}

                <div className="col-span-2">
                  {renderSection("🏡 생활 정보", lifeInfo)}
                </div>
              </div>

              <div className="flex justify-end mt-2 mr-1">
                <span className="text-[12px] text-gray-400">
                  프로필 등록일 · 2026/01/01
                </span>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
      
      {/* 수정, 삭제 버튼 */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          onClick={() => navigate("/dog-profile-edit", { state: dog })}
          className="px-4 py-2 w-[90px] bg-sky-500 text-white text-[14px] font-bold rounded-xl hover:bg-sky-600 transition"
        >
          수정
        </button>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 w-[90px] bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 transition"
        >
          삭제
        </button>
      </div>
      
    </div>
    
  )
}

export default DogDetailPage
