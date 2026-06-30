

// 훅 연결 (더미 배열 → 실 API)
import { useDogs } from "../../hooks/useDogs"
import { onImgError } from "../../utils/imageFallback"

// 함수 땡겨오기 (genderMap·getWalkType 은 현재 카드에서 미사용 → 제외)
import { activityMap } from "../../constants/dogConstants"

// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

function DogListPage() {

    const navigate = useNavigate()

    // 산책 태그
    const getWalkType = (favorWalkTime = []) => {
      const hasMorning = favorWalkTime.some((hour) => hour < 12)
      const hasAfternoon = favorWalkTime.some((hour) => hour >= 12)

      if (hasMorning && hasAfternoon) {
        return "종일 산책형"
      }

      if (hasMorning) {
        return "오전 산책형"
      }

      if (hasAfternoon) {
        return "오후 산책형"
      }

      return "🐾 산책형"
    }

    
    // 실 API: DogResponse[] = { dogId, name, breed:{nameKr}, birthDate, age,
    //   weight, gender:'M'|'F', isNeutered, activityLevel:'저'|'중'|'고',
    //   healthNotes, profileImageUrl, createdAt }
    const { dogs, loading, error } = useDogs()

    // 대표 강아지게 목록의 제일 처음에 오게
    const sortedDogs = [...dogs].sort((a, b) => {
      if (a.isMain === b.isMain) return 0
      return a.isMain ? -1 : 1
    })

    if (loading) {
      return <div className="p-4">불러오는 중...</div>
    }

    if (error) {
      return <div className="p-4 text-danger">목록을 불러오지 못했습니다.</div>
    }


  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            반려견 프로필 목록
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              등록된 반려견 프로필을 확인하고 관리할 수 있어요.
            </p>
          </div>
        </div>

        {/* 등록수 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm 
                        border border-txtcolor-100/50">
          <p className="text-[12px] font-semibold text-txtcolor-400">등록된 프로필</p>
          <p className="text-[20px] font-bold text-brand-700">{dogs.length}개</p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-txtcolor-400/40 mb-[20px]'/>

      {/* 프로필 목록 */}
      <div className='flex flex-col gap-[20px]'>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
          {sortedDogs.map((dog) => (

            <div
              key={dog.dogId}
              onClick={() => navigate(`/dog-profile-detail/${dog.dogId}`)}
              className="group relative flex w-[350px] h-[470px] gap-2
              overflow-hidden rounded-xl shadow
              cursor-pointer transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg"
            >
              <div className='relative'>
                {/* 강아지 이미지 */}
                <div className="relative shrink-0">
                  {dog.profileImageUrl ? (
                    <img
                      src={dog.profileImageUrl}
                      onError={onImgError()}
                      className="w-[350px] h-[470px] rounded-xl object-cover shadow-md"
                      alt={dog.name}
                    />
                  ) : (
                    <div
                      className="
                        w-[350px] h-[470px]
                        rounded-xl shadow
                        bg-txtcolor-100/25
                        flex flex-col items-center justify-center
                      "
                    >
                      <div className="text-[64px]">🐶</div>
                    </div>
                  )}

                  {/* 이미지 검은색 그라데이션 */}
                  <div className="absolute bottom-0 left-0
                      w-full h-1/2 rounded-b-xl
                      bg-gradient-to-t
                      from-black/90
                      via-black/40
                      to-transparent"/>

                  {/* 프로필 등록일 (createdAt → YYYY/MM/DD) */}
                  <p className='absolute top-4 right-4
                      px-3 py-1 rounded-full
                      bg-white/80 backdrop-blur
                      text-[12px] font-medium text-txtcolor-800'>
                    프로필 등록일 · {dog.createdAt ? dog.createdAt.slice(0, 10).replaceAll("-", "/") : "—"}
                  </p>

                  {/* 이름 + 간단정보 + 성향 */}
                  <div className='absolute bottom-4 left-4 flex flex-col gap-3'>
                    <div className='flex flex-col ml-1 mb-[20px]'>
                      <div className='flex items-center gap-2'>
                        <p className=" text-[32px] text-white font-bold">{dog.name}</p>

                        {/* 대표 강아지 표시 (dog.isMain) */}
                        {dog.isMain && (
                          <span className="mt-[3px] text-[20px] font-semibold">⭐</span>
                        )}
                      </div>

                      {/* birthDate(널 가드) · breed.nameKr(괄호 앞만) */}
                      <p className="ml-1 mb-2
                        text-white/90 text-[12px]">
                        {dog.birthDate ? dog.birthDate.replaceAll("-", "/") : "생일 미등록"} · {dog.breed?.nameKr?.split("(")[0].trim() ?? "믹스"}
                      </p>

                      <div className="flex gap-[6px]">
                        {dog.activityLevel && (
                          <span className="px-3 py-[2px]
                                rounded-full bg-white/20 backdrop-blur
                                text-[12px] text-white/90"> {activityMap[dog.activityLevel]}</span>
                        )}

                        {dog.favorWalkTime?.length > 0 && (
                          <span className="px-3 py-[2px] rounded-full bg-white/20 backdrop-blur text-[12px] text-white/90">
                            {getWalkType(dog.favorWalkTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 반려견 프로필 추가 */}
          <div
            onClick={() => navigate("/dog-profile-create")}
            className="
              flex items-center justify-center
              w-[350px] h-[470px] rounded-xl
              border-2 border-dashed border-txtcolor-100
              cursor-pointer transition group hover:bg-txtcolor-100/25
            "
          >
            <div className="flex flex-col items-center gap-2 text-txtcolor-300 group-hover:text-txtcolor-500 transition">
              <div className="text-[52px] font-bold">+</div>
              <p className="text-[16px] font-medium">반려견 프로필 추가</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DogListPage
