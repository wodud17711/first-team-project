import { useNavigate, useParams } from "react-router-dom"
import { deleteDog, getDog } from "../../api/dogs"
import { onImgError } from "../../utils/imageFallback"

// 함수 땡겨오기
import { genderMap, activityMap, walkTimes} from "../../constants/dogConstants"
import { useEffect, useState } from "react"

function DogDetailPage() {

  const navigate = useNavigate()

  const { dogId } = useParams()

  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDog = async () => {
      try {
        const data = await getDog(dogId)
        setDog(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDog()
  }, [dogId])


  // 👉 로딩/빈 데이터 상태 UI
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        불러오는 중...
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="p-6 text-center text-gray-500">
        선택된 반려견 프로필 정보를 가져오는데 문제가 생겼어요! 🐶
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
      value:
        Array.isArray(dog.favorWalkTime) &&
        dog.favorWalkTime.length > 0 ? dog.favorWalkTime
              .map((hour) => walkTimes[hour]).join(", ")
          : "정보 없음",
    },
    {
      label: "건강 특이사항🩹",
      value: dog.healthNotes || "없음",
    },
  ]

  // 프로필 상세 내용
  const renderSection = (title, data) => (
    <div className="bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 px-5 py-4">
      <h3 className="flex items-center text-[18px] font-bold text-txtcolor-700 mb-4">
        <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
        {title}
      </h3>

      <div className="flex flex-col gap-3">
      {data.map((info) => (
        <div key={info.label} className="flex items-center text-[14px]">

          <span className="font-semibold shrink-0 text-txtcolor-600">
            {info.label}
          </span>

          <div className="flex-1 mx-3 border-b border-dashed border-txtcolor-200" />

          <span className="text-txtcolor-500 shrink-0">
            {info.value}
          </span>

        </div>
      ))}
      </div>
    </div>
  )

  // 삭제 클릭 시, 경고창 + 페이지 이동(지금은 실제로 삭제기능 X)
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "정말 삭제하시겠습니까?"
    )

    if (!confirmDelete) return

    try {
      await deleteDog(dog.dogId)

      alert("삭제되었습니다.")

      navigate("/dog-profile-list")
    } catch {
      alert("삭제에 실패했습니다.")
    }
  }


  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">반려견 프로필 상세</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              등록된 반려견 프로필의 상세 내용을 확인할 수 있어요.
            </p>
          </div>
        </div>
        {/* 목록 */}
        <button
          onClick={() => navigate("/dog-profile-list")}
          className="flex items-center gap-2 absolute right-0 bottom-0 px-4 py-2 
                     rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
        >
          <img src="/list.png" alt="마이페이지" className="w-[20px] h-[20px] invert brightness-0"/> 
          목록으로
        </button>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />


      {/* 강아지 프로필 상세칸 */}
      <div className="flex flex-col items-center space-y-6">        
        <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">

          {/* 강아지 이미지 */}
          <div className="relative shrink-0 w-full md:w-auto">
            {dog.profileImageUrl ? (
              <img
                src={dog.profileImageUrl}
                onError={onImgError()}
                className="w-full md:w-[350px] h-[470px] rounded-xl object-cover "
                alt={dog.name}
              />
            ) : (
              <div
                className="
                  w-full md:w-[350px] h-[470px]
                  rounded-xl shadow
                  bg-txtcolor-100/25
                  flex flex-col items-center justify-center
                "
              >
                <div className="text-[64px]">🐶</div>

                <p className="mt-2 text-[14px] text-txtcolor-400">
                  프로필 사진이 등록되지 않았어요
                </p>
              </div>
            )}
          </div>

          {/* 강아지 정보 */}
          <div className="flex flex-col w-full">
            <div className="flex-1 bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-4">
              <div className="flex items-center mb-3 ml-1 gap-3">
                <h2 className="text-[36px] font-extrabold text-txtcolor-700">
                  {dog.name}
                </h2>
                {dog.isMain && (
                  <span className="px-2 py-[2px] text-[12px] rounded-full bg-sky-100 text-sky-600 font-semibold">
                    대표
                  </span>
                )}
              </div>
                
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSection("📋 기본 정보", basicInfo)}
                {renderSection("🔎 상세 정보", detailInfo)}

                <div className="col-span-2">
                  {renderSection("🏡 생활 정보", lifeInfo)}
                </div>
              </div>

              <div className="flex justify-end mt-2 mr-1">
                <span className="text-[12px] text-txtcolor-300">
                  프로필 등록일 · 2026/01/01
                </span>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
      
      {/* 수정, 삭제 버튼 */}
      <div className="flex justify-end gap-3 mt-[20px] pt-4 
                      border-t border-txtcolor-100/60">
        <button
          onClick={() => navigate(`/dog-profile-edit/${dog.dogId}`)}
          className="px-4 py-2 w-[90px] 
                     rounded-xl bg-brand-300 text-txtcolor-700 text-[14px] font-bold
                     shadow-sm hover:bg-brand-400 transition"
        >
          수정
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 w-[90px]
                     rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                     shadow-sm hover:bg-txtcolor-200/60 transition"
        >
          삭제
        </button>
      </div>
      
    </div>
    
  )
}

export default DogDetailPage
