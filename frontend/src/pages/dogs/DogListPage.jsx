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

      {/* 상단 제목 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[28px] text-sky-800 font-bold">반려견 프로필 목록</h1>
      </div>
      <div className='w-full h-[1px] bg-sky-400 mb-[30px]'/>


      <div className='flex flex-col gap-[20px]'>
        {/* 프로필 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {dogs.map((dog, index) => (
            <div
              key={dog.id}
              onClick={() => navigate("/dog-profile-detail", { state: dog })}
              className="group relative flex h-full bg-white rounded-xl shadow p-6 gap-2 cursor-pointer"
            >
              

              <div className='flex flex-col'>
                {/* 강아지 이미지 */}
                <div className="relative shrink-0">
                  <img
                    src={dog.img}
                    className="w-[400px] h-[230px] rounded-xl object-cover"
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
                <div className='flex flex-col flex-1'>
                  <div className="flex items-center justify-center text-white bg-gray-700 rounded-lg gap-6 mt-6 mb-2 p-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px]">이름:</p>
                      <p className="text-[14px]">{dog.name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-[14px]">견종:</p>
                      <p className="text-[14px]">{dog.breed}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 mb-2 rounded-lg text-[14px] border border-gray-700">
                    {/* 생년월일 */}
                    <div className="flex items-center gap-3">
                      <p className="w-[80px]">생년월일🎂</p>
                      <div className="flex-1 border-b border-dashed border-gray-400 translate-y-[2px]" />
                      <p>{dog.birth}</p>
                    </div>

                    {/* 성별 */}
                    <div className="flex items-center gap-3">
                      <p className="w-[80px]">성별🤍</p>
                      <div className="flex-1 border-b border-dashed border-gray-400 translate-y-[2px]" />
                      <p>
                        {dog.gender}
                        <span className={dog.gender === "여아" ? "text-pink-400" : "text-sky-400"}>
                          {dog.gender === "여아" ? "🩷" : "🩵"}
                        </span>{" "}
                      </p>
                    </div>

                    {/* 체중 */}
                    <div className="flex items-center gap-3">
                      <p className="w-[80px]">체중🐾</p>
                      <div className="flex-1 border-b border-dashed border-gray-400 translate-y-[2px]" />
                      <p>{dog.weight}kg</p>
                    </div>

                    {/* 성향 태그 */}
                    <div className="flex items-center gap-3">
                      <p className="w-[80px]">성향🧩</p>
                      <div className="flex-1 border-b border-dashed border-gray-400 translate-y-[2px]" />
                      <div className="flex flex-wrap gap-1">
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

                  </div>

                  {/* 프로필 등록일 */}
                  <div className='flex px-3 py-1
                        bg-sky-100 rounded-lg text-sky-700 text-[12px] font-bold'>
                      프로필 등록일 · 2026/01/01
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
              h-full
              hover:bg-[#F0F0F0]
              border-2 border-dashed border-gray-300
              rounded-xl
              cursor-pointer
              transition
              group
            "
          >
            <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600 transition">
              <div className="text-[48px] font-bold">+</div>
              <p className="text-[14px] mt-2">반려견 프로필 추가</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default DogListPage
