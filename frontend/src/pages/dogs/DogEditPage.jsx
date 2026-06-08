import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { searchBreeds } from "../../api/breeds";

// 강아지 기본(폴백) 사진
import dogImg1 from '../../assets/dogImg1.jpg'

// 함수 땡겨오기 (그대로 유지)
import { genders, neuteredOptions, activityLevels, walkTimes } from "../../constants/dogConstants"

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm px-6 py-5">
      <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function DogEditPage() {
  
  const navigate = useNavigate()

  // 목록 만든 강아지 데이터 받기
  const location = useLocation()
  const dog = location.state || {}

  // 강아지 이미지 주소 저장
  const [previewImg, setPreviewImg] = useState(dog.profileImageUrl)

  // 강아지 이미지 변경 함수
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setPreviewImg(imageUrl)
  }

  // 대표 강아지 설정 여부
  const [isMain, setIsMain] = useState(dog.isMain ?? false)

  // 견종 검색 state
  const [breedKeyword, setBreedKeyword] = useState(dog.breed?.nameKr || "")
  const [breedResults, setBreedResults] = useState([])
  const [openBreed, setOpenBreed] = useState(false)
  const [mixMode, setMixMode] = useState(false)

  const breedRef = useRef(null)

  // 인풋 코드 줄이기
  const inputs = [
    { label: "이름", name: "name" },
    { label: "생년월일", name: "birthDate" },
    { label: "견종", name: "breed" },
    { label: "성별", name: "gender" },
    { label: "체중", name: "weight" },
    { label: "중성화", name: "isNeutered" },
    { label: "활동량", name: "activityLevel" },
    { label: "선호 산책 시간", name: "favorWalkTime" },
    { label: "건강 특이사항", name: "healthNotes" },
  ]

  // 수정용 state
  const [form, setForm] = useState({
    name: dog.name || "",
    birthDate: dog.birthDate || "",
    breed: dog.breed || "",
    breedId: dog.breedId || "",
    gender: dog.gender || "",
    weight: dog.weight || "",
    isNeutered: dog.isNeutered ?? "",
    activityLevel: dog.activityLevel || "",
    favorWalkTime: dog.favorWalkTime || [],
    healthNotes: dog.healthNotes || "",
  })

  // input 변경 함수
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }

  // 견종 검색: 입력할 때마다 /api/breeds 호출. 다시 입력하면 이전 선택(breedId) 해제.
  const handleBreedSearch = async (kw) => {
    setBreedKeyword(kw)
    setForm((f) => ({ ...f, breedId: "" }))
    if (kw.trim().length < 1) {
      setBreedResults([])
      setOpenBreed(false)
      return
    }
    try {
      const list = await searchBreeds(kw.trim())
      setBreedResults(list ?? [])
      setOpenBreed(true)
    } catch {
      setBreedResults([])
    }
  }

  // 견종 선택: 숫자 breedId 저장 + 입력칸에 견종명 표시.
  const handleSelectBreed = (b) => {
    setForm((f) => ({ ...f, breedId: b.breedId }))
    setBreedKeyword(b.nameKr)
    setOpenBreed(false)
  }


  // 선호 선택 시간 목록 펼쳐져있는지 여부
  const [openWalkTime, setOpenWalkTime] = useState(false)

  // 선호 선택 시간 + 견종 선택 버튼 누르지 않아도 목록 밖 화면 빈 곳 아무대나 눌렀을 때 목록창 꺼지게
  const walkTimeRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (walkTimeRef.current && !walkTimeRef.current.contains(e.target)) {
        setOpenWalkTime(false)
      }

      if (breedRef.current && !breedRef.current.contains(e.target)) {
        setOpenBreed(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 선호 산책 시간 - 제거 가능하게, 최대 3개 선택가능하게
  const handleWalkTime = (hour) => {
    const isSelected = form.favorWalkTime.includes(hour);

    // 제거
    if (isSelected) {
      setForm({
        ...form,
        favorWalkTime: form.favorWalkTime.filter((h) => h !== hour),
      });
      return;
    }

    // 추가 (최대 3개 제한만 유지)
    if (form.favorWalkTime.length < 3) {
      setForm({
        ...form,
        favorWalkTime: [...form.favorWalkTime, hour].sort(
          (a, b) => a - b
        ),
      })
    }
  }

  // 확인 클릭 시, 알림창 + 페이지 이동(지금은 실제로 수정기능 X)
  const handleSubmit = () => {
    if (!form.name.trim()) {
    alert("이름을 입력해주세요.")
    return
  }
  if (!form.birthDate.trim()) {
    alert("생년월일을 입력해주세요.")
    return
  }
  if (!form.breedId) {
    alert("견종을 선택해주세요.")
    return
  }
  if (!form.gender) {
    alert("성별을 선택해주세요.")
    return
  }
  if (!form.weight) {
    alert("체중을 입력해주세요.")
    return
  }
  if (form.isNeutered === "") {
    alert("중성화 여부를 선택해주세요.")
    return
  }
  if (!form.activityLevel) {
    alert("활동량을 선택해주세요.")
    return
  }
  if (form.favorWalkTime.length === 0) {
    alert("선호 산책 시간을 1개 이상 선택해주세요.")
    return
  }
  const confirmEdit = window.confirm(
    "수정을 완료하시겠습니까?"
  )
    if (confirmEdit) {
      navigate("/dog-profile-detail", {
        state: {
          dog: {
            ...dog,
            ...form,
            profileImageUrl: previewImg,
            isMain,
          },
          index,
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
      navigate("/dog-profile-detail", {
        state: {
          dog,
        },
      })
    }
  }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            반려견 프로필 수정
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              등록된 반려견 프로필의 정보를 수정할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>


      <div className="flex gap-6">
        {/* 이미지 */}
        <div className="relative flex flex-col gap-3">
          <img
            src={previewImg || dogImg1}
            className="w-[340px] h-[420px] rounded-xl object-cover shadow"
          />

          {/* 변경, 삭제 버튼 */}
          <div className="absolute top-3 right-3 flex gap-2">
            <label className="px-3 py-1 text-[12px] font-medium bg-white/80 backdrop-blur rounded-full cursor-pointer">
              📷 변경
              <input type="file" hidden onChange={handleImageChange} />
            </label>

            <button
              type="button"
              onClick={() => setPreviewImg(null)}
              className="px-3 py-1 text-[12px] font-medium bg-white/80 backdrop-blur rounded-full text-red-500"
            >
              🗑️ 삭제
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMain(!isMain)}
            className={`py-2 rounded-xl border ${
              isMain ? "bg-sky-100 border-sky-400" : "bg-white"
            }`}
          >
            {isMain ? "⭐ 대표 강아지" : "대표 강아지 설정"}
          </button>
        </div>


        {/* 폼 */}
        <div className="flex-1 flex flex-col gap-4">
          <Section title="📋 기본 정보">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>

                <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px]
                                    focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                placeholder="반려견의 이름을 입력하세요"
              />
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  생년월일 <span className="text-red-500">*</span>
                </label>

                <input
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[16px] border border-gray-100
                                      focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                  placeholder="생년월일(YYYY-MM-DD)을 입력하세요"
                />
              </div>
              

              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  견종 선택 <span className="text-red-500">*</span>
                </label>

                <p className="text-[12px] text-gray-500 mb-2">
                  먼저 순종 또는 믹스견을 선택한 후 견종을 검색해주세요.
                </p>

                <div className="relative" ref={breedRef}>
                  {/* 순종 / 믹스견 토글 */}
                  <div className="flex gap-2 mb-2">
                    {[
                      { mix: false, label: "순종" },
                      { mix: true, label: "믹스견" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setMixMode(opt.mix)
                          if (breedKeyword.trim().length >= 1) setOpenBreed(true)
                        }}
                        className={`flex-1 px-3 py-2 rounded-xl border border-gray-300 text-[13px] font-medium
                          ${mixMode === opt.mix
                            ? "bg-brand-200 border-brand-500"
                            : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0] transition"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={breedKeyword}
                    onChange={(e) => handleBreedSearch(e.target.value)}
                    onFocus={() => { if (breedResults.length > 0) setOpenBreed(true) }}
                    placeholder={mixMode
                      ? "부모·이름으로 믹스견 검색 (예: 푸들, 말티푸)"
                      : "순종을 검색하세요 (예: 말티즈)"}
                    className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl text-[16px] border border-gray-100
                              focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                  />
                  {openBreed && (() => {
                    // 믹스견은 nameKr 에 '×' 포함 → 모드에 맞춰 필터 (토글 시 재검색 없이 즉시 재필터)
                    const list = breedResults.filter((b) =>
                      mixMode ? b.nameKr.includes("×") : !b.nameKr.includes("×")
                    )
                    return (
                      <div className="absolute top-full mt-2 w-full max-h-[220px] overflow-y-auto bg-white border rounded-xl py-2 shadow z-10">
                        {list.length > 0 ? (
                          list.map((b) => (
                            <button
                              key={b.breedId}
                              type="button"
                              onClick={() => handleSelectBreed(b)}
                              className="w-full text-left px-4 py-2 text-[14px] hover:bg-brand-100"
                            >
                              {b.nameKr}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-2 text-[13px] text-gray-400">
                            {mixMode ? "믹스견 검색 결과가 없어요" : "순종 검색 결과가 없어요"}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  성별 <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  {genders.map((g) => (
                    <button
                      type="button"
                      key={g.value}
                      onClick={() => setForm({ ...form, gender: g.value })}
                      className={`flex-1 px-3 py-2 rounded-xl border border-gray-300 text-[13px] font-medium ${
                        form.gender === g.value ? "bg-brand-200 border-brand-500" : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0] transition"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>


          <Section title="🔎 상세 정보">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  체중 <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => {
                      const value = e.target.value

                      // 숫자 + 소수점 1개 + 소수점 이하 1자리만 허용
                      if (/^\d*\.?\d?$/.test(value)) {
                        setForm((prev) => ({
                          ...prev,
                          weight: value,
                        }))
                      }
                    }}
                    className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[16px] border border-gray-100
                                    focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                    placeholder="무게를 입력하세요"
                  />
                  {form.weight && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">
                      kg
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  중성화 여부 <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  {neuteredOptions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          isNeutered: item.value,
                        }))
                      }
                      className={`flex-1 px-3 py-2 rounded-xl border border-gray-300 text-[13px] font-medium ${
                        form.isNeutered === item.value
                          ? "bg-brand-200 border-brand-500"
                          : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0] transition"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>


          <Section title="🏡 생활 정보">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  활동량 <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  {activityLevels.map((a) => (
                    <button
                      type="button"
                      key={a.value}
                      onClick={() =>
                        setForm({ ...form, activityLevel: a.value })
                      }
                      className={`flex-1 px-3 py-2 rounded-xl border border-gray-300 text-[13px] font-medium ${
                        form.activityLevel === a.value
                          ? "bg-brand-200 border-brand-500"
                          : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0] transition"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>              

              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  선호 산책 시간 <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={walkTimeRef}>
                  <button
                    type="button"
                    onClick={() => setOpenWalkTime(!openWalkTime)}
                    className={`w-full px-3 py-4 bg-[#f7f7f7] rounded-xl border border-gray-100 text-left text-[16px] hover:bg-[#F0F0F0] transition
                                ${form.favorWalkTime.length > 0 ? "text-black" : "text-gray-400"}
                                ${openWalkTime ? "outline outline-2 outline-brand-300" : ""}`}
                  >
                    {form.favorWalkTime.length > 0
                    ? form.favorWalkTime.map((h) => walkTimes[h]).join(", ")
                    : "선호 산책 시간을 선택하세요"}
                  </button>

                  {openWalkTime && (
                    <div className="absolute top-full mt-2 w-full bg-white border rounded-xl px-2 py-4 shadow z-10">
                      <div className="flex flex-wrap justify-center gap-2">
                        {walkTimes.map((time, hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => handleWalkTime(hour)}
                            className={`w-[120px] px-3 py-2 rounded border border-gray-300 text-[12px] 
                              ${form.favorWalkTime.includes(hour)
                                ? "bg-brand-200 border-brand-500"
                                : "bg-white hover:bg-[#F0F0F0] transition"
                              }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                  건강 특이사항 <span className="text-gray-400">(선택)</span>
                </label>
                <textarea
                  name="healthNotes"
                  value={form.healthNotes}
                  onChange={handleChange}
                  className="p-3 w-full bg-gray-100 rounded-xl text-[16px] border border-gray-100 hover:bg-[#F0F0F0] transition"
                  placeholder="건강 특이사항 (선택)"
                />
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* 저장, 취소 버튼 */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 w-[90px] bg-sky-500 text-white rounded-xl"
        >
          저장
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