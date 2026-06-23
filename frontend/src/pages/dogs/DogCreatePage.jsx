import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { searchBreeds } from "../../api/breeds";
import { createDog } from "../../api/dogs"

// 함수 땡겨오기 (그대로 유지)
import { genders, neuteredOptions, activityLevels, walkTimes } from "../../constants/dogConstants"

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-5">
      <h3 className="flex items-center text-[20px] font-bold text-txtcolor-700 mb-4">
        <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function DogCreatePage() {
  
  const navigate = useNavigate()

  // 강아지 이미지 주소 저장
  const [previewImg, setPreviewImg] = useState(null)

  // 강아지 이미지 변경 함수
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setPreviewImg(imageUrl)
  }

  // 대표 강아지 설정 여부
  const [isMain, setIsMain] = useState(false)

  // 견종 검색 state
  const [breedKeyword, setBreedKeyword] = useState("")
  const [breedResults, setBreedResults] = useState([])
  const [openBreed, setOpenBreed] = useState(false)
  const [mixMode, setMixMode] = useState(false)

  const breedRef = useRef(null)

  // 입력용 state
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    breed: "",
    breedId: "",
    gender: "",
    weight: "",
    isNeutered: "",
    activityLevel: "",
    favorWalkTime: [],
    healthNotes: "",
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

  // 확인 클릭 시, 알림창 + 페이지 이동
  const handleSubmit = async () => {
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
    "등록을 완료하시겠습니까?"
  )

  if (!confirmEdit) return

    try {
      await createDog({
        name: form.name,
        breedId: form.breedId || null,
        birthDate: form.birthDate,
        weight: Number(form.weight),
        gender: form.gender,
        isNeutered: form.isNeutered,
        activityLevel: form.activityLevel,
        healthNotes: form.healthNotes,
        profileImageUrl: previewImg,

        favorWalkTime: form.favorWalkTime,
        isMain,
      })

      alert("반려견 프로필이 등록되었습니다.")

      navigate("/dog-profile-list")
    } catch (err) {
      console.error(err)
      alert("등록에 실패했습니다.")
    }
  }

  // 취소 클릭 시, 경고창 + 페이지 이동
  const handleGoDetail = () => {
    const confirmMove = window.confirm(
      "변경사항이 저장되지 않을 수 있습니다!\n취소하시겠습니까?"
    )

    if (confirmMove) {
      navigate("/dog-profile-list")
    }
  }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            반려견 프로필 등록
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              새로운 반려견 프로필의 정보를 등록할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>


      <div className="flex gap-6">
        {/* 이미지 */}
        <div className="relative flex flex-col gap-3">
          {previewImg ? (
            <img
              src={previewImg}
              className="w-[350px] h-[470px] rounded-xl object-cover shadow"
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

              <p className="mt-2 text-[14px] text-txtcolor-400">
                프로필 사진을 등록해주세요
              </p>
            </div>
          )}

          {/* 대표 강아지 설정 */}
          <div className="absolute top-3 right-3">
            <div
              onClick={() => setIsMain(!isMain)}
              className="flex items-center gap-2 px-3 py-2
                         rounded-full bg-white/80 backdrop-blur
                         shadow-sm cursor-pointer select-none">
              <span className="text-[13px] font-semibold text-txtcolor-700">
                ⭐ 대표 강아지
              </span>

              <div
                className={`w-10 h-5 rounded-full transition-colors duration-300 ease-in-out relative
                  ${isMain ? "bg-brand-500" : "bg-gray-300"}
                `}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full
                    transition-all duration-300 ease-in-out
                    ${isMain ? "left-5" : "left-0.5"}
                  `}
                />
              </div>
            </div>
          </div>

          {/* 변경, 삭제 버튼 */}
          <div className="flex gap-2">
            <label className="flex flex-1 px-4 py-2 items-center justify-center
                              rounded-xl bg-brand-500 text-txtcolor-700 text-[14px] font-bold
                              shadow-sm hover:bg-brand-600/80 transition cursor-pointer">
              사진 변경
              <input type="file" hidden onChange={handleImageChange} />
            </label>

            <button
              type="button"
              onClick={() => setPreviewImg(null)}
              className="flex flex-1 px-4 py-2 items-center justify-center
                         rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                         shadow-sm hover:bg-txtcolor-200/80 transition cursor-pointer"
            >
               삭제
            </button>
          </div>
        </div>


        {/* 폼 */}
        <div className="flex-1 flex flex-col gap-4">
          <Section title="📋 기본 정보">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  이름 <span className="text-red-500">*</span>
                </label>

                <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                             text-txtcolor-700 text-[16px]
                             focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                placeholder="반려견의 이름을 입력하세요"
              />
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  생년월일 <span className="text-red-500">*</span>
                </label>

                <input
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                             text-txtcolor-700 text-[16px]
                             focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                  placeholder="생년월일(YYYY-MM-DD)을 입력하세요"
                />
              </div>
              

              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  견종 선택 <span className="text-red-500">*</span>
                </label>

                <p className="text-[12px] text-txtcolor-400 mb-2">
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
                        className={`flex-1 px-3 py-2 rounded-xl border text-[13px] font-semibold
                          ${mixMode === opt.mix
                            ? "bg-brand-200 border-brand-500 text-txtcolor-700"
                            : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
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
                    className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[16px] text-txtcolor-700
                               focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                  />
                  {openBreed && (() => {
                    // 믹스견은 nameKr 에 '×' 포함 → 모드에 맞춰 필터 (토글 시 재검색 없이 즉시 재필터)
                    const list = breedResults.filter((b) =>
                      mixMode ? b.nameKr.includes("×") : !b.nameKr.includes("×")
                    )
                    return (
                      <div className="absolute top-full mt-2 w-full max-h-[220px] overflow-y-auto 
                                      bg-white border border-txtcolor-100/50 rounded-xl py-2 shadow z-10">
                        {list.length > 0 ? (
                          list.map((b) => (
                            <button
                              key={b.breedId}
                              type="button"
                              onClick={() => handleSelectBreed(b)}
                              className="w-full text-left px-4 py-2 text-[14px] text-txtcolor-700 hover:bg-brand-100/50"
                            >
                              {b.nameKr}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-2 text-[13px] text-txtcolor-400">
                            {mixMode ? "믹스견 검색 결과가 없어요" : "순종 검색 결과가 없어요"}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  성별 <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  {genders.map((g) => (
                    <button
                      type="button"
                      key={g.value}
                      onClick={() => setForm({ ...form, gender: g.value })}
                      className={`flex-1 px-3 py-3 rounded-xl border text-[13px] font-semibold ${
                        form.gender === g.value 
                        ? "bg-brand-200 border-brand-500 text-txtcolor-700" 
                        : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
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
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
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
                    className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[16px] text-txtcolor-700
                               focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                    placeholder="무게를 입력하세요"
                  />
                  {form.weight && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-txtcolor-300">
                      kg
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
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
                      className={`flex-1 px-3 py-2 rounded-xl border text-[13px] font-semibold ${
                        form.isNeutered === item.value
                          ? "bg-brand-200 border-brand-500 text-txtcolor-700" 
                          : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
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
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
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
                      className={`flex-1 px-3 py-2 rounded-xl border text-[13px] font-semibold ${
                        form.activityLevel === a.value
                          ? "bg-brand-200 border-brand-500 text-txtcolor-700" 
                          : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>              

              <div>
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  선호 산책 시간 <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={walkTimeRef}>
                  <button
                    type="button"
                    onClick={() => setOpenWalkTime(!openWalkTime)}
                    className={`w-full px-3 py-3 rounded-xl border border-txtcolor-50
                                bg-txtcolor-50/50 text-left text-[16px]
                                hover:bg-txtcolor-100/40 transition
                                ${form.favorWalkTime.length > 0 ? "text-txtcolor-700" : "text-gray-400"}
                                ${openWalkTime ? "outline outline-2 outline-brand-500" : ""}`}
                  >
                    {form.favorWalkTime.length > 0
                    ? form.favorWalkTime.map((h) => walkTimes[h]).join(", ")
                    : "선호 산책 시간을 선택하세요"}
                  </button>

                  {openWalkTime && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-txtcolor-100/50 rounded-xl px-2 py-4 shadow z-10">
                      <div className="flex flex-wrap justify-center gap-2">
                        {walkTimes.map((time, hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => handleWalkTime(hour)}
                            className={`w-[120px] px-3 py-2 rounded-lg border text-[12px] 
                              ${form.favorWalkTime.includes(hour)
                                ? "bg-brand-200 border-brand-500 text-txtcolor-700" 
                                : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
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
                <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                  건강 특이사항 <span className="text-txtcolor-300">(선택)</span>
                </label>
                <textarea
                  name="healthNotes"
                  value={form.healthNotes}
                  onChange={handleChange}
                  className="w-full px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[16px] text-txtcolor-700
                             focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                  placeholder="건강 특이사항 (선택)"
                />
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* 저장, 취소 버튼 */}
      <div className="flex justify-end gap-3 mt-[20px] pt-4 
                      border-t border-txtcolor-100/60">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 w-[90px] 
                     rounded-xl bg-brand-500 text-txtcolor-700 text-[14px] font-bold
                     shadow-sm hover:bg-brand-600/80 transition"
        >
          저장
        </button>
        <button
          onClick={handleGoDetail}
          className="px-4 py-2 w-[90px]
                     rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                     shadow-sm hover:bg-txtcolor-200/80 transition"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default DogCreatePage