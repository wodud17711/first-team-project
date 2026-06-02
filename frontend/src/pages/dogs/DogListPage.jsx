// 강아지 테스트 사진
import dogImg1 from '../../assets/dogImg1.jpg'


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"
import { useDogs } from "../../hooks/useDogs"

function DogListPage() {

  const navigate = useNavigate()
  const { dogs, loading, error } = useDogs() // 기존 const dogs = [{ 멍멍일... }, { 멍멍이... }] 삭제

  const genderLabel = (g) => (g === "F" ? "여아" : "남아")  // 백엔드는 "M" / "F" 로 변환

  if (loading) return <div className="p-4">불러오는 중...</div> // 로딩
  if (error) return <div className="p-4 text-danger">목록을 불러오지 못했어요</div> // 에러

  return (
    <div className="p-4">

      {/* 상단 제목 + 프로필 추가 버튼*/}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[28px] font-bold">반려견 프로필 목록</h1>

        <button
          onClick={() => navigate("/dog-profile-create")}
          className="px-4 py-2 bg-brand-500 text-white text-[14px] font-bold rounded-xl"
        >
          프로필 추가
        </button>
      </div>
      <div className='w-full h-[1px] bg-brand-400 mb-[30px]'/>

      {/* 강아지 0 마리면 등록 유도 */}
      {dogs.length === 0 ? (
        <div className="text-center text-txtxolor-400 py-16">
          아직 등록된 반려견이 없어요
        </div>
      ) : (
        <div className='flex flex-col gap-[20px]'>
        {/* 프로필 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {dogs.map((dog, index) => (  // index 추가 ( 대표 강아지 표시 용 )

            <div
              key={dog.dogId}
              onClick={() => navigate("/dog-profile-detail", { state: dog })}
              className="group relative flex bg-white rounded-xl shadow px-6 py-5 gap-2 cursor-pointer"
            >

              {/* 강아지 이미지 */}
              <div className="relative shrink-0">
                <img
                  src={dog.profileImageUrl || dogImg1}  // dog.img > dog.profileImageUrl ( 없으면 기본 )
                  className="w-[180px] h-[230px] rounded-2xl object-cover"
                />

                {/* 첫 번째 강아지만 대표 강아지 표시 */}
                {index === 0 && (  // dog.isMain → 첫 번째를 대표로
                <span
                  className="
                    absolute top-3 left-3
                    px-2 py-1 rounded-full
                    bg-white/90 backdrop-blur
                    text-[11px] font-bold
                  "
                >
                  ⭐ 대표 강아지
                </span>
              )}
              </div>

              {/* 강아지 정보 */}
              <div className='flex flex-col flex-1 pr-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <p className="text-[24px] font-bold">{dog.name}</p>
                  <div className='flex px-3 py-1
                      bg-sky-100 rounded-full text-sky-700 text-[12px] font-bold'>
                    프로필 등록일 · 2026/01/01
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 text-[14px]">

                  {/* dog.birth → birthDate + ageYears */}
                  <p className='pb-1 border-b-[1px] border-brand-300'>
                    🎂 {dog.birthDate ?? '생일 미등록'}
                    {dog.age != null && ` (${dog.age}살)`}
                  </p>
                  {/* dog.breed(글자) → dog.breed?.nameKr */}
                  <p className='pb-1 border-b-[1px] border-brand-300'>
                    🐶 {dog.breed?.nameKr ?? '믹스'}
                  </p>
                  {/* gender "여아"/"남아" → "F"/"M" */}
                  <p className='pb-1 border-b-[1px] border-brand-300'>
                    <span
                      className=
                      {dog.gender === "F" ? "text-pink-400" : "text-sky-400"}>
                      {dog.gender === "F" ? "🩷" : "🩵"}
                    </span>{" "}
                    {genderLabel(dog.gender)}
                  </p>
                  <p className='pb-1 border-b-[1px] border-brand-300'>🐾 {dog.weight}kg</p>
                  {/* favorwalktime 줄 삭제 (API에 없음). 대신 활동량 표시 */}
                  {dog.activityLevel && (
                    <p className='pb-1 border-b-[1px] border-brand-300'>⚡ 활동량 {dog.activityLevel}</p>
                  )}
                </div>

                {/* 🔌 dog.tags 블록 삭제 (API에 없음).
                    필요하면 healthNotes 배지로 대체 가능 */}

                {dog.healthNotes && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="px-2 py-[2px] rounded-full bg-gray-100 text-[11px]">
                      📋 {dog.healthNotes}
                    </span>
                  </div>
                )}
                
              </div>
              
              {/* 우측 화살표 */}
              <div className="
                absolute right-5 top-1/2 -translate-y-1/2
                text-[36px]
                text-gray-300
                group-hover:text-txtcolor-500
              ">
                ›
              </div>

            </div>
          ))}
        </div>

      </div>
      )}

    </div>
  )
}

export default DogListPage
