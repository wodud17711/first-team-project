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


      <div className='flex flex-col gap-[20px]'>
        {/* 프로필 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {dogs.map((dog, index) => (
            <div
              key={dog.id}
              onClick={() => navigate("/dog-profile-detail", { state: dog })}
              className="group relative flex bg-white rounded-xl shadow px-6 py-5 gap-2 cursor-pointer"
            >

              {/* 강아지 이미지 */}
              <div className="relative shrink-0">
                <img
                  src={dog.img}
                  className="w-[180px] h-[230px] rounded-2xl object-cover"
                />

                {/* 첫 번째 강아지만 대표 강아지 표시 */}
                {dog.isMain && (
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
                  <p className='pb-1 border-b-[1px] border-brand-300'>🎂 {dog.birth}</p>
                  <p className='pb-1 border-b-[1px] border-brand-300'>🐶 {dog.breed}</p>
                  <p className='pb-1 border-b-[1px] border-brand-300'>
                    <span
                      className={
                        dog.gender === "여아"
                          ? "text-pink-400"
                          : "text-sky-400"
                      }
                    >
                      {dog.gender === "여아" ? "🩷" : "🩵"}
                    </span>{" "}
                    {dog.gender}
                  </p>
                  <p className='pb-1 border-b-[1px] border-brand-300'>🐾 {dog.weight}kg</p>
                  <p className='pb-1 border-b-[1px] border-brand-300'>🚶 {dog.favorwalktime.join(", ")}</p>
                </div>

                {/* 성향 태그 */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {dog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="
                        px-2 py-[2px]
                        rounded-full
                        bg-gray-100
                        text-[11px]
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
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

      
    </div>
  )
}

export default DogListPage
