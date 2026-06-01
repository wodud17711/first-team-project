import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"


function DogEditPage() {

  const navigate = useNavigate()

  // 목록 만든 강아지 데이터 받기
  const location = useLocation()
  const dog = location.state || {}

  // 강아지 이미지 주소 저장
  const [previewImg, setPreviewImg] = useState(dog.img)

  // 강아지 이미지 변경 함수
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setPreviewImg(imageUrl)
  }

  // 대표 강아지 설정 여부
  const [isMain, setIsMain] = useState(dog.isMain || false)

  // 인풋 코드 줄이기
  const inputs = [
    { label: "이름", name: "name" },
    { label: "생년월일", name: "birth" },
    { label: "견종", name: "breed" },
    { label: "성별", name: "gender" },
    { label: "체중", name: "weight" },
    { label: "선호 산책 시간", name: "favorwalktime" },
    { label: "건강 특이사항", name: "health" },
    { label: "털길이", name: "hairlength" },
  ]

  // 수정용 state
  const [form, setForm] = useState({
    name: dog.name || "",
    birth: dog.birth || "",
    breed: dog.breed || "",
    gender: dog.gender || "",
    weight: dog.weight || "",
    favorwalktime: dog.favorwalktime || [],
    health: dog.health || "",
    hairlength: dog.hairlength || "",
  })

  // input 변경 함수
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }


  // 선호 선택 시간 목록 펼쳐져있는지 여부
  const [openWalkTime, setOpenWalkTime] = useState(false)

  // 선호 선택 시간 버튼 누르지 않아도 목록 밖 화면 빈 곳 아무대나 눌렀을 때 목록창 꺼지게
  const walkTimeRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (walkTimeRef.current && !walkTimeRef.current.contains(e.target)) {
        setOpenWalkTime(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 선호 산책 시간 선택 목록 배열
  const walkTimes = [
    ...Array.from({length: 12}, (_, i) =>
    `오전 ${i}~${i+1}시`),
    ...Array.from({length: 12}, (_, i) =>
    `오후 ${i === 0 ? 12 : i}~${i+1}시`)
  ]

  // 선호 산책 시간 - 제거 가능하게, 최대 3개 선택가능하게
  const handleWalkTime = (time) => {
    // 이미 선택된 경우, 재클릭 시 제거
    if (form.favorwalktime.includes(time)){
      setForm({
        ...form,
        favorwalktime: form.favorwalktime.filter((t) => t !== time)
      })
      return
    }

    // 최대 3개까지만 선택 가능하게
    if (form.favorwalktime.length < 3){
      // 시간 순서대로 정렬(오후 시간대 누른 다음 오전 눌러도 순서대로 정렬되게)
      const updated = [...form.favorwalktime, time]
      updated.sort(
        (a, b) => walkTimes.indexOf(a) - walkTimes.indexOf(b)
      )

      setForm({
        ...form,
        favorwalktime: updated
      })
    }
  }

  // 성별 선택 버튼
  const genders = [
    { value: "남아" },
    { value: "여아" },
  ]

  // 털길이 선택 버튼 코드 줄이기 위해 사용
  const hairlength = [
      { value: "단모종", title: "단모", desc: "짧고 매끈" },
      { value: "장모종", title: "장모", desc: "길고 풍성" }
  ]

  // 확인 클릭 시, 알림창 + 페이지 이동(지금은 실제로 수정기능 X)
  const handleSubmit = () => {
    const confirmEdit  = window.confirm(
      "수정을 완료하시겠습니까?"
    )

    if (confirmEdit) {
      navigate("/dog-profile-detail", {
        state: {
          ...dog,
          ...form,
          img: previewImg,
          isMain,
        }
      })
    }
  }

  // 취소 클릭 시, 경고창 + 페이지 이동(지금은 실제로 취소기능 X)
  const handleGoDetail = () => {
    const confirmMove = window.confirm(
      "변경사항이 저장되지 않을 수 있습니다!\n취소하시겠습니까?"
    )
    if (confirmMove) {
      navigate("/dog-profile-detail", {state: dog})
    }
  }


  return (
    <div className="p-4">
      {/* 상단 제목 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[28px] font-bold">반려견 프로필 수정</h1>
      </div>
      <div className='w-full h-[1px] bg-brand-400 mb-[30px]'/>

      {/* 강아지 프로필 상세칸 */}
      <div className="flex flex-col items-center space-y-6">        
        <div className="flex items-start w-3/4 bg-white rounded-xl px-[30px] py-[24px] shadow hover:shadow-lg transition">
          
          {/* 강아지 사진 */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={previewImg}
                alt="강아지 사진"
                className="w-[300px] h-[350px] rounded-xl object-cover"
              />

              {/* 사진 변경 버튼 */}
              <label
                htmlFor="dog-image"
                className="
                  absolute bottom-3 right-3
                  px-3 py-2
                  bg-white/60
                  rounded-lg text-[13px] font-bold
                  cursor-pointer
                  hover:bg-black/10
                  transition
                "
              >
                📷 사진 변경
              </label>

              <input
                id="dog-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* 대표 강아지 설정 */}
            <button
            type="button"
            onClick={() => setIsMain(!isMain)}
            className={`
              w-full py-3 rounded-xl border font-bold
              ${
                isMain
                  ? "bg-brand-200 border-brand-500"
                  : "bg-white border-gray-300"
              }
            `}
            >
              {isMain ? "⭐ 대표 강아지" : "대표 강아지로 설정"}
            </button>
          </div>

          {/* 강아지 정보 */}
          <div className="flex flex-col gap-2 px-4 w-full text-[14px]">

            {inputs.map((item) => (
            <div key={item.name} className="flex items-center gap-4">

              <p className="w-[110px] text-[16px] font-bold text-txtcolor-400">
                {item.label}
              </p>


              {/* 성별 선택 */}
                {item.name === "gender" ? (
                <div className="flex-1">
                  <div className="flex gap-2">
                    {genders.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, gender: g.value })
                        }
                        className={`w-1/2 flex items-center justify-center
                          px-4 py-3 rounded-xl border text-[14px] transition
                          ${
                            form.gender === g.value
                              ? "bg-brand-200 border-brand-500"
                              : "bg-white border-txtcolor-200 hover:bg-[#F0F0F0]"
                          }`}
                      >
                        <span>{g.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

              // 체중
              ): item.name === "weight" ? (
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => {
                      let value = e.target.value
                      value = value.replace(/[^0-9.]/g, "")

                      const parts = value.split(".")
                      if (parts.length > 2) value = parts[0] + "." + parts[1]
                      if (parts[1]?.length > 1) {
                        value = parts[0] + "." + parts[1].slice(0, 1)
                      }

                      setForm({ ...form, weight: value })
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#f7f7f7]
                    focus:outline-brand-300 hover:bg-[#F0F0F0]"
                  />

                  {form.weight && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      kg
                    </span>
                  )}
                </div>

              ) : item.name === "favorwalktime" ? (

                /* 선호 산책 시간 */
                <div ref={walkTimeRef} className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setOpenWalkTime(!openWalkTime)}
                    className={`w-full px-4 py-3 rounded-xl bg-[#f7f7f7] text-left
                               hover:bg-[#F0F0F0]
                               ${openWalkTime ? "outline outline-2 outline-brand-300" : ""}
                               ${form.favorwalktime.length > 0 ? "text-black" : "text-gray-400"}`}
                  >
                    {form.favorwalktime.length > 0
                      ? form.favorwalktime.join(", ")
                      : "선호 산책 시간을 선택하세요"}
                  </button>

                  {openWalkTime && (
                    <div className="absolute top-full mt-2 w-full bg-white border rounded-xl p-3 shadow z-10">
                      <div className="flex flex-wrap gap-2">
                        {walkTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleWalkTime(time)}
                            className={`px-2 py-1 rounded border text-[12px]
                              ${form.favorwalktime.includes(time)
                                ? "bg-brand-200 border-brand-500"
                                : "bg-white"
                              }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                // 털길이 선택
                ) : item.name === "hairlength" ? (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    {hairlength.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, hairlength: c.value })
                        }
                        className={`w-1/2 flex items-center justify-center
                          px-4 py-3 rounded-xl border text-[14px] transition
                          ${
                            form.hairlength === c.value
                              ? "bg-brand-200 border-brand-500"
                              : "bg-white border-txtcolor-200 hover:bg-[#F0F0F0]"
                          }`}
                      >
                        <span className="text-[14px]">{c.title}</span>
                        <span className="text-[12px]">({c.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                // 나머지 인풋들
                ) : (
                <input
                  type="text"
                  name={item.name}
                  value={form[item.name]}
                  onChange={handleChange}
                  className="flex-1 w-full px-4 py-3 rounded-xl bg-[#f7f7f7] 
                  focus:outline-brand-300 hover:bg-[#F0F0F0]"
                />
              )}
            </div>
          ))}

          </div>
          
        </div>
      </div>
      
      {/* 확인, 취소 버튼 */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleSubmit}
          className="px-3 py-2 w-[90px] bg-brand-500 text-white text-[14px] font-bold rounded-xl"
        >
          확인
        </button>
        <button
          onClick={handleGoDetail}
          className="px-3 py-2 w-[90px] bg-danger text-white text-[14px] font-bold rounded-xl"
        >
          취소
        </button>
      </div>
      
    </div>
  )
}

export default DogEditPage
