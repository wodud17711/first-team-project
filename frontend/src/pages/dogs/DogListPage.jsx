// 강아지 테스트 사진
import dogImg1 from '../../assets/dogImg1.jpg'
import dogImg2 from '../../assets/dogImg2.jpeg'


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

function DogListPage() {

    const navigate = useNavigate()

    // 강아지 정보 배열(임시)
    const dogs = [
        {
        id: 1,
        name: "멍멍일",
        birth: "2023/01/01",
        breed: "리트리버",
        gender: "여아",
        weight: 26,
        hairlength: "장모종",
        health: "특이사항 없음",
        favorwalktime: ["오전 10~11시", "오후 2~3시", "오후 7~8시"],
        img: dogImg1,
        tags: ["활동적", "종일 산책형"],
        isMain: true
        },
        {
        id: 2,
        name: "멍멍이",
        birth: "2021/01/01",
        breed: "사모예드",
        gender: "남아",
        weight: 21,
        hairlength: "장모종",
        health: "더위에 취약",
        favorwalktime: ["오전 9~10시"],
        img: dogImg2,
        tags: ["내성적", "오전 산책형"],
        isMain: false
        }
    ]

  

  return (
    <div className="p-4">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-2">
        {/* 제목 */}
        <h1 className="text-[32px] text-sky-800 font-extrabold">반려견 프로필 목록</h1>

        {/* 등록수 */}
        <p className="text-[14px] text-gray-500">
          총 {dogs.length}마리 등록됨
        </p>
      </div>
      <div className='w-full h-[1px] bg-sky-400 mb-[30px]'/>


      <div className='flex flex-col gap-[20px]'>
        {/* 프로필 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">

          {dogs.map((dog, index) => (
            <div
              key={dog.id}
              onClick={() => navigate("/dog-profile-detail", { state: dog })}
              className="group relative flex w-[350px] h-[500px] gap-2 
              overflow-hidden rounded-xl shadow
              cursor-pointer transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg"
            >
              <div className='relative'>
                {/* 강아지 이미지 */}
                <div className="relative shrink-0">
                  <img
                    src={dog.img}
                    className="w-full h-[500px] rounded-xl object-cover"
                  />

                  {/* 이미지 검은색 그라데이션 */}
                  <div className="absolute bottom-0 left-0
                      w-full h-1/2 rounded-b-xl
                      bg-gradient-to-t
                      from-black/90
                      via-black/40
                      to-transparent"/>

                  

                  <p className='absolute top-4 right-4
                      px-3 py-1 rounded-full
                      bg-white/90 backdrop-blur
                      text-[12px] font-medium'>프로필 등록일 · 2026/01/01</p>


                  {/* 이름 + 간단정보 + 성향 + 등록일 */}
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
                         text-white/90 text-[12px]">{dog.birth} · {dog.breed}</p>

                        <div className="flex gap-[6px]">
                          {dog.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-[2px]
                                rounded-full bg-white/20 backdrop-blur
                                text-[12px] text-white/90">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                    {/* <p className='ml-1 text-white/70 text-[12px] font-regular'>프로필 등록일 · 2026/01/01</p> */}
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
              w-[350px] h-[500px] rounded-xl
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