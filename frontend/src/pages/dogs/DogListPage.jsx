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
        weight: 26,
        img: dogImg1,
        tags: ["활동적", "종일 산책형"]
        },
        {
        id: 2,
        name: "멍멍이",
        birth: "2021/01/01",
        breed: "사모예드",
        weight: 21,
        img: dogImg2,
        tags: ["내성적", "오전 산책형"]
        }
    ]

  

  return (
    <div className="p-4">

      {/* 상단 제목 + 프로필 추가 버튼*/}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[24px] font-bold">반려견 프로필 목록</h1>

        <button
          onClick={() => navigate("/dog-profile-create")}
          className="px-3 py-2 bg-brand-500 text-white text-[14px] font-bold rounded-xl"
        >
          프로필 추가
        </button>
      </div>

        {/* 컬럼 헤더 */}
        <div className="flex items-center px-3 py-2 mb-3 text-[12px] text-gray-500 border-b">
            <div className="w-[80px]"/>
            <div className="flex-1 flex justify-between">
                <span>프로필</span>
                <span>이름</span>
                <span>생일</span>
                <span>견종</span>
                <span>체중</span>
                <span>성향</span>
            </div>
        </div>

      {/* 프로필 목록 */}
      <div className="flex flex-col gap-3">

        {dogs.map((dog) => (
          <div
            key={dog.id}
            onClick={() => navigate("/dog-profile-detail", {state: dog})}
            className="flex items-center bg-white rounded-xl shadow p-3 gap-3 cursor-pointer"
          >

            {/* 이미지 */}
            <img
              src={dog.img}
              className="w-[100px] h-[100px] rounded-full object-cover border-4 border-white"
            />

            {/* 정보 */}
            <div>
              <p className="text-[18px] font-bold">{dog.name}</p>
              <p className="text-[12px]">
                🎂 {dog.birth} · 🐶 {dog.breed} · {dog.weight}kg
              </p>

              {/* 태그 */}
              <div className="flex gap-1 mt-1">
                {dog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-[2px] rounded-full bg-gray-100 text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ))}

      </div>
    </div>
  )
}

export default DogListPage
