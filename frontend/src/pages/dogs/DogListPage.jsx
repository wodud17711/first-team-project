// 강아지 테스트 사진
import dogImg1 from '../../assets/dogImg1.jpg'
import dogImg2 from '../../assets/dogImg2.jpeg'

// 훅 연결
import { useDogs } from "../../hooks/useDogs";


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

function DogListPage() {

    const navigate = useNavigate()

    // // 정보 받기
    // const {
    //   dogs,
    //   loading,
    //   error,
    // } = useDogs();

    // 강아지 정보 배열(임시)
    const dogs = [
        {
        id: 1,
        name: "멍멍일",
        birthDate: "2023-01-01",
        ageYears:"3살",
        breed: "리트리버",
        gender: "F",
        weight: 26,
        isNeutered: true,
        healthNotes: "특이사항 없음",
        favorwalktime: ["오전 10~11시", "오후 2~3시", "오후 7~8시"],
        activityLevel:"고",
        profileImageUrl: dogImg1,
        isMain: true
        },
        {
        id: 2,
        name: "멍멍이",
        birthDate: "2021-01-01",
        ageYears:"5살",
        breed: "사모예드",
        gender: "M",
        weight: 21,
        isNeutered: true,
        healthNotes: "더위에 취약",
        favorwalktime: ["오전 9~10시"],
        activityLevel:"저",
        profileImageUrl: dogImg2,
        isMain: false
        }
    ]

    // 성별에 따른 이름
    const genderMap = {
      F: { text: "여아", icon: "🩷" },
      M: { text: "남아", icon: "🩵" },
    };

    // 활동량 저, 중, 고에 따른 태그이름
    const activityMap = {
      저: "느긋함",
      중: "활기참",
      고: "에너자이저",
    };

    // 선호 산책 시간에 따른 태그 이름
    const getWalkType = (times) => {
      const hasMorning = times.some(t => t.includes("오전"));
      const hasAfternoon = times.some(t => t.includes("오후"));

      if (hasMorning && hasAfternoon) return "종일 산책형";
      if (hasMorning) return "오전 산책형";
      if (hasAfternoon) return "오후 산책형";

      return "미지정";
    };

    

    // if (loading) {
    //   return <div>불러오는 중...</div>
    // }

    // if (error) {
    //   return <div>목록을 불러오지 못했습니다.</div>
    // }
    


  return (
    <div className="p-4">

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
              key={dog.id}
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
                    src={dog.profileImageUrl}
                    className="w-[350px] h-[470px] rounded-xl object-cover"
                  />

                  {/* 이미지 검은색 그라데이션 */}
                  <div className="absolute bottom-0 left-0
                      w-full h-1/2 rounded-b-xl
                      bg-gradient-to-t
                      from-black/90
                      via-black/40
                      to-transparent"/>

                  {/* 프로필 등록일 */}
                  <p className='absolute top-4 right-4
                      px-3 py-1 rounded-full
                      bg-white/80 backdrop-blur
                      text-[12px] font-medium'>프로필 등록일 · 2026/01/01</p>

                  {/* 이름 + 간단정보 + 성향 */}
                  <div className='absolute bottom-4 left-4 flex flex-col gap-3'>
                    <div className='flex flex-col ml-1 mb-[20px]'>
                      <div className='flex items-center gap-2'>
                        <p className=" text-[32px] text-white font-bold">{dog.name}</p>

                        {/* 첫 번째 강아지만 대표 강아지 표시 */}
                        {dog.isMain && (
                        <span className="mt-[3px] text-[20px] font-semibold">⭐</span>
                        )}
                      </div>

                      <p className="ml-1 mb-2
                        text-white/90 text-[12px]">{dog.birthDate.replaceAll("-", "/")} · {dog.breed.split("(")[0].trim()}</p>

                      <div className="flex gap-[6px]">
                        <span className="px-3 py-[2px]
                              rounded-full bg-white/20 backdrop-blur
                              text-[12px] text-white/90"> {activityMap[dog.activityLevel]}</span>
                        <span className="px-3 py-[2px]
                              rounded-full bg-white/20 backdrop-blur
                              text-[12px] text-white/90"> {getWalkType(dog.favorwalktime)}</span>
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