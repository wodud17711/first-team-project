

// 강아지 기본(폴백) 사진
import dogImg1 from '../../assets/dogImg1.jpg'

// 훅 연결 (더미 배열 → 실 API)
import { useDogs } from "../../hooks/useDogs"

// 함수 땡겨오기 (genderMap·getWalkType 은 현재 카드에서 미사용 → 제외)
import { activityMap } from "../../constants/dogConstants"

// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

function DogListPage() {

    const navigate = useNavigate()

    // 실 API: DogResponse[] = { dogId, name, breed:{nameKr}, birthDate, age,
    //   weight, gender:'M'|'F', isNeutered, activityLevel:'저'|'중'|'고',
    //   healthNotes, profileImageUrl, createdAt }
    const { dogs, loading, error } = useDogs()

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
          <h1 className="text-[32px] font-extrabold text-sky-800">
            반려견 프로필 목록
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              등록된 반려견 프로필을 확인하고 관리할 수 있어요.
            </p>
          </div>
        </div>

        {/* 등록수 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border">
          <p className="text-[12px] text-gray-500">등록된 프로필</p>
          <p className="text-[20px] font-bold text-sky-700">{dogs.length}개</p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>

      {/* 프로필 목록 */}
      <div className='flex flex-col gap-[20px]'>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
          {dogs.map((dog, index) => (

            <div
              key={dog.dogId}
              onClick={() => navigate("/dog-profile-detail", { state: dog })}
              className="group relative flex w-[350px] h-[470px] gap-2
              overflow-hidden rounded-xl shadow
              cursor-pointer transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg"
            >
              <div className='relative'>
                {/* 강아지 이미지 */}
                <div className="relative shrink-0">
                  <img
                    src={dog.profileImageUrl || dogImg1}
                    className="w-[350px] h-[470px] rounded-xl object-cover"
                  />

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
                      text-[12px] font-medium'>
                    프로필 등록일 · {dog.createdAt ? dog.createdAt.slice(0, 10).replaceAll("-", "/") : "—"}
                  </p>

                  {/* 이름 + 간단정보 + 성향 */}
                  <div className='absolute bottom-4 left-4 flex flex-col gap-3'>
                    <div className='flex flex-col ml-1 mb-[20px]'>
                      <div className='flex items-center gap-2'>
                        <p className=" text-[32px] text-white font-bold">{dog.name}</p>

                        {/* 첫 번째 강아지만 대표 강아지 표시 (dog.isMain → index === 0) */}
                        {index === 0 && (
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

                        {/* 🔌 산책 유형 태그 보류: API(DogResponse)에 favorwalktime 필드가 없음.
                            원형: <span className="...">{getWalkType(dog.favorwalktime)}</span>
                            → 제거하거나 다른 실데이터(예: 🐾 {dog.weight}kg, 성별 등)로 대체할지 정선혜 확인.
                            대체하려면 위 import 에 getWalkType/관련 함수 다시 추가. */}
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
              border-2 border-dashed border-gray-300
              cursor-pointer transition group hover:bg-[#F0F0F0]
            "
          >
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600 transition">
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
