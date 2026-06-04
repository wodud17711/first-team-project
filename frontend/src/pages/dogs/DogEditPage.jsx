import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// 함수 땡겨오기 (그대로 유지)
import { genders, formatWeight, activityLevels, walkTimes } from "../../constants/dogConstants"

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
  const [isMain, setIsMain] = useState(dog.isMain || false)

  // 견종 검색 state
  const [breedKeyword, setBreedKeyword] = useState(dog.breed || "")
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
    { label: "선호 산책 시간", name: "favorwalktime" },
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
    isNeutered: dog.isNeutered || "",
    activityLevel: dog.activityLevel || "",
    favorwalktime: dog.favorwalktime || [],
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
          profileImageUrl: previewImg,
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

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-xl border shadow-sm px-6 py-5">
      <h3 className="flex items-center text-[18px] font-bold text-sky-900 mb-4">
        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )




  return (
    <div className="p-4 animate-fadeIn">

      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-[32px] font-extrabold text-sky-800">
          반려견 프로필 수정
        </h1>
        <div className="w-full h-[1px] bg-sky-700/50 mt-3" />
      </div>

      <div className="flex gap-6">

        {/* 이미지 */}
        <div className="shrink-0 flex flex-col gap-3">
          <img
            src={previewImg}
            className="w-[340px] h-[420px] rounded-xl object-cover shadow"
          />

          <label className="text-sky-700 text-center cursor-pointer">
            📷 사진 변경
            <input type="file" hidden onChange={handleImageChange} />
          </label>

          <button
            onClick={() => setIsMain(!isMain)}
            className={`py-2 rounded-xl border ${
              isMain ? "bg-sky-100 border-sky-400" : "bg-white"
            }`}
          >
            {isMain ? "⭐ 대표 강아지" : "대표 설정"}
          </button>
        </div>

        {/* 폼 */}
        <div className="flex-1 flex flex-col gap-4">

          {/* ================= 기본 정보 ================= */}
          <Section title="📋 기본 정보">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[16px]
                                  focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
              placeholder="반려견의 이름을 입력하세요"
            />

            <input
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[16px]
                                  focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
              placeholder="생년월일(8자리)를 입력하세요"
            />

            <div ref={breedRef} className="relative">
              <input
                value={breedKeyword}
                onChange={(e) => setBreedKeyword(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-xl"
                placeholder="견종"
              />

              {openBreed && breedResults.length > 0 && (
                <div className="absolute w-full bg-white border rounded-xl mt-2 z-10">
                  {breedResults.map((b) => (
                    <div
                      key={b.breedId}
                      onClick={() => {
                        setForm({ ...form, breedId: b.breedId })
                        setBreedKeyword(b.nameKr)
                        setOpenBreed(false)
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {b.nameKr}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {genders.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setForm({ ...form, gender: g.value })}
                  className={`flex-1 p-2 rounded-xl ${
                    form.gender === g.value ? "bg-sky-200" : "bg-gray-100"
                  }`}
                >
                  {g.value}
                </button>
              ))}
            </div>
          </Section>

          {/* ================= 상세 정보 ================= */}
          <Section title="🔎 상세 정보">

            <div className="relative">
              <input
                value={form.weight}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weight: formatWeight(e.target.value),
                  })
                }
                className="w-full p-3 bg-gray-100 rounded-xl"
                placeholder="무게를 입력하세요"
              />
              {form.weight && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">
                  kg
                </span>
              )}
            </div>
            

            <div className="flex gap-2">
              <button
                onClick={() => setForm({ ...form, isNeutered: true })}
                className={`flex-1 p-2 rounded-xl ${
                  form.isNeutered ? "bg-sky-200" : "bg-gray-100"
                }`}
              >
                중성화 O
              </button>

              <button
                onClick={() => setForm({ ...form, isNeutered: false })}
                className={`flex-1 p-2 rounded-xl ${
                  !form.isNeutered ? "bg-sky-200" : "bg-gray-100"
                }`}
              >
                중성화 X
              </button>
            </div>
          </Section>

          {/* ================= 생활 정보 ================= */}
          <Section title="🏡 생활 정보">

            

            <div className="flex gap-2">
              {activityLevels.map((a) => (
                <button
                  key={a.value}
                  onClick={() =>
                    setForm({ ...form, activityLevel: a.value })
                  }
                  className={`flex-1 p-2 rounded-xl ${
                    form.activityLevel === a.value
                      ? "bg-sky-200"
                      : "bg-gray-100"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div ref={walkTimeRef}>
              <button
                onClick={() => setOpenWalkTime(!openWalkTime)}
                className="w-full p-3 bg-gray-100 rounded-xl text-left"
              >
                {form.favorwalktime.join(", ") || "산책 시간"}
              </button>

              {openWalkTime && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {walkTimes.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleWalkTime(t)}
                      className={`px-2 py-1 rounded ${
                        form.favorwalktime.includes(t)
                          ? "bg-sky-200"
                          : "bg-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              name="healthNotes"
              value={form.healthNotes}
              onChange={handleChange}
              className="p-3 bg-gray-100 rounded-xl"
              placeholder="건강 특이사항"
            />
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