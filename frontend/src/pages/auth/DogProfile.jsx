import { Fragment, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCreateDog } from "../../hooks/useCreateDog";
import { searchBreeds } from "../../api/breeds";

import { neuteredOptions, activityLevels, walkTimes } from "../../constants/dogConstants"


// 온보딩 진행바 (active 단계만 강조, 지난 단계는 체크)
function Steps({ active }) {
  const steps = [
    { n: 1, label: "계정 생성" },
    { n: 2, label: "반려견 프로필" },
    { n: 3, label: "완료" },
  ]
  return (
    <div className="w-full mb-6 flex items-center justify-center">
      <div className="flex items-center text-[13px] font-medium">
        {steps.map((s, i) => {
          const done = s.n < active
          const current = s.n === active
          return (
            <Fragment key={s.n}>
              {i > 0 && (
                <div className="w-10 h-px bg-txtcolor-200 mx-1 self-start mt-[14px]" />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center
                  ${done || current ? "bg-brand-300 text-txtcolor-700" : "bg-txtcolor-100/50 text-txtcolor-400"}`}>
                  {done ? "✓" : s.n}
                </div>
                <p className={`w-[80px] flex justify-center mt-1 text-[12px]
                  ${done || current ? "text-txtcolor-500 font-bold" : "text-txtcolor-300"}`}>
                  {s.label}
                </p>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}


function DogProfile() {

    // 반려견 프로필 등록 훅 연결
    const { create, loading, error } = useCreateDog()

    // 페이지 이동
    const navigate = useNavigate()

    // 반려견 정보 입력값 저장하는 저장소역할
    const initialForm = {
      dogname: "",
      dogbirth: "",
      breedId: "",
      gender: "",
      weight: "",
      isNeutered: "",
      activityLevel: "",
      favorWalkTime: [],
      health: "",
    }
    const [form, setForm] = useState(initialForm)

    const fieldLabels = {
      dogname: "이름",
      dogbirth: "생년월일",
      breedId: "견종 선택",
      gender: "성별",
      weight: "체중",
      isNeutered: "중성화 여부",
      activityLevel: "활동량",
      favorWalkTime: "선호 산책 시간",
      health: "건강 특이사항",
    }

    const requiredFields = [
      "dogname",
      "dogbirth",
      "breedId",
      "gender",
      "weight",
      "isNeutered",
      "activityLevel",
      "favorWalkTime",
    ]

    // 추가한 반려견 프로필 정보들 저장
    const [addedDogs, setAddedDogs] = useState([])

    // 등록 완료(3단계) 화면 표시 여부
    const [done, setDone] = useState(false)


    // 선호 선택 시간 목록 펼쳐져있는지 여부
    const [openWalkTime, setOpenWalkTime] = useState(false)

    // 견종 검색 상태 (입력칸 표시값 · 검색결과 목록 · 드롭다운 열림)
    // form.breedId 에는 선택한 견종의 숫자 ID 만 저장한다 (백엔드는 breedId:Long 기대).
    const [breedKeyword, setBreedKeyword] = useState("")
    const [breedResults, setBreedResults] = useState([])
    const [openBreed, setOpenBreed] = useState(false)
    // 순종/믹스견 보기 토글 (false=순종, true=믹스견). 믹스견은 nameKr 에 '×' 가 들어감.
    const [mixMode, setMixMode] = useState(false)
    const breedRef = useRef(null)

    // 선호 선택 시간 버튼 누르지 않아도 목록 밖 화면 빈 곳 아무대나 눌렀을 때 목록창 꺼지게
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
      if (form.favorWalkTime.includes(time)){
        setForm({
          ...form,
          favorWalkTime: form.favorWalkTime.filter((t) => t !== time)
        })
        return
      }

      // 최대 3개까지만 선택 가능하게
      if (form.favorWalkTime.length < 3){
        // 시간 순서대로 정렬(오후 시간대 누른 다음 오전 눌러도 순서대로 정렬되게)
        const updated = [...form.favorWalkTime, time]
        updated.sort(
          (a, b) => walkTimes.indexOf(a) - walkTimes.indexOf(b)
        )

        setForm({
          ...form,
          favorWalkTime: updated
        })
      }
    }
    

    // input들을 한 함수로 다 처리하는 역할
    // 사용자가 입력한 값 value를 form 객체의 해당 필드에 넣어주는 함수
    const handleChange = (e) => {   // input에서 발생한 이벤트(e)를 받음
        const {name, value} = e.target   // name: 어떤 input인지, value: 사용자가 입력한 값
        setForm({
            ...form,   // 기존 form 다 복사
            [name]: value   // name에 해당하는 값만 바꾸기
        })
    }

    // "20200123"(8자리) → "2020-01-23" (백엔드 LocalDate = ISO yyyy-MM-dd). 8자리 아니면 null.
    const toIsoDate = (raw) => {
      const digits = (raw ?? "").replace(/\D/g, "")
      if (digits.length !== 8) return null
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    }

    // 백엔드에 보낼 데이터 형태 변환
    const toPayload = () => ({
      name: form.dogname,
      birthDate: toIsoDate(form.dogbirth),
      breedId: form.breedId || null,
      gender: form.gender || null,
      weight: form.weight ? parseFloat(form.weight) : null,

      isNeutered: form.isNeutered,
      activityLevel: form.activityLevel,

      favorWalkTime: form.favorWalkTime ?? [],
      healthNotes: form.health || null,
    })

    // 완료 눌렀을 때 
    const handleDone = async (e) => {
      e.preventDefault()

      const dog = await create(toPayload())
      if (!dog) return

      setDone(true)
    }

    // 프로필 추가 눌렀을 때
    const handleAdd = async () => {
      const dog = await create(toPayload())
      if (!dog) return

      setAddedDogs((prev) => [...prev, dog])
      setForm(initialForm)
      setBreedKeyword("")
      setBreedResults([])
    }

    // 나중에 하기 눌렀을 때
    const handleSkip = () => {
      navigate("/")
    }


    // 성별 선택 버튼
    const gender = [
      { value: "M", title: "남아", desc: "" },
      { value: "F", title: "여아", desc: "" }
    ]

    // 정보 입력칸 성격별 분리
    const sections = [
      {
        title: "📋 기본 정보",
        fields: ["dogname", "dogbirth", "breedId", "gender"]
      },
      {
        title: "🔎 상세 정보",
        fields: ["weight", "isNeutered"]
      },
      {
        title: "🏡 생활 정보",
        fields: ["activityLevel", "favorWalkTime", "health"]
      }
    ]

    


  return (
    <div className="p-4 animate-fadeIn">
      <div className="flex flex-col items-center space-y-6">
        <Link to="/">
          <img
            src="/navigationbar/SiteLogo.png"
            alt="사이트 로고"
            className="w-[120px] h-auto mt-6 block transition"
          />
        </Link>
        
        <section className="w-[400px] bg-white rounded-xl border border-txtcolor-100/50 
                            px-8 py-12 shadow-sm">

          {done ? (
            /* 3단계: 등록 완료 */
            <div className="flex flex-col items-center">
              <h1 className="text-[24px] font-bold mb-6">완료</h1>
              <Steps active={3} />

              {/* 초록 원 + 흰 체크 */}
              <div className="mt-10 w-20 h-20 rounded-full bg-green-400 flex items-center justify-center">
                <span className="text-white text-[40px] leading-none">✓</span>
              </div>

              <p className="mt-6 text-[18px] font-bold text-txtcolor-700">등록이 완료되었습니다!</p>
              <p className="text-[13px] text-txtcolor-400">반려견 프로필이 저장되었어요</p>

              <button type="button" onClick={() => navigate("/")}
                      className="w-full mt-10 py-3 bg-txtcolor-700 text-white text-[16px] font-bold
                                rounded-xl shadow-sm transition hover:bg-txtcolor-900">
                홈으로 이동
              </button>
            </div>
          ) : (
          <form onSubmit={handleDone}
                className="flex flex-col items-center">
              <h1 className="text-[24px] text-txtcolor-700 font-extrabold mb-1">반려견 프로필 등록</h1>

              {/* 버튼 밑 공지글 */}
              <div className="w-full flex items-center justify-center 
                              text-[12px] text-txtcolor-400">
                  <p>반려견에게 알맞는 정보를 제공하기 위해 사용됩니다</p>
              </div>
              <div className="w-full mb-6 flex items-center justify-center 
                              text-[12px] text-txtcolor-400">
                  <p>프로필은 나중에도 추가할 수 있어요(스킵가능)</p>
              </div>

              {/* 회원가입 단계표시 */}
              <Steps active={2} />


              <div className="w-full mt-4 flex flex-col gap-6">

                {/* 기본 정보 */}
                <div className="flex flex-col gap-3 pb-7 border-b border-txtcolor-200">
                  <h3 className="flex items-center text-[16px] font-bold text-txtcolor-700 mb-2">
                    <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />📋 기본 정보
                  </h3>
                  <div className="flex flex-col gap-4">
                    {/* 이름 */}
                    <div>
                      <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="dogname"
                        value={form.dogname}
                        onChange={handleChange}
                        placeholder="반려견의 이름을 입력하세요"
                        className="w-full px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                                  text-[14px] text-txtcolor-700
                                  focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                      />
                    </div>
                    
                    {/* 생년월일 */}
                    <div>
                      <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                      생년월일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="dogbirth"
                        value={form.dogbirth}
                        onChange={handleChange}
                        placeholder="생년월일(YYYY-MM-DD)을 입력하세요"
                        className="w-full px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                                  text-[14px] text-txtcolor-700
                                  focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                      />
                    </div>

                    {/* 견종 선택 */}
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
                          className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[14px] text-txtcolor-700
                                    focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                        />
                        {openBreed && (() => {
                          const list = breedResults.filter((b) =>
                            mixMode ? b.nameKr.includes("×") : !b.nameKr.includes("×")
                          )

                          return (
                            <div className="absolute top-full mt-2 w-full max-h-[220px] overflow-y-auto 
                                            bg-white border border-txtcolor-100/50 rounded-xl shadow z-10 p-2">

                              {list.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {list.map((b) => (
                                    <button
                                      key={b.breedId}
                                      type="button"
                                      onClick={() => handleSelectBreed(b)}
                                      className={`px-3 py-2 rounded-lg text-left text-[14px]
                                        hover:bg-brand-100/50 transition
                                        ${
                                          breedKeyword === b.nameKr
                                            ? "bg-brand-200/70 text-txtcolor-700 font-semibold"
                                            : "text-txtcolor-600"
                                        }
                                      `}
                                    >
                                      {b.nameKr}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-3 py-2 text-[13px] text-txtcolor-400">
                                  {mixMode ? "믹스견 검색 결과가 없어요" : "순종 검색 결과가 없어요"}
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* 성별 */}
                  <div>
                    <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                      성별 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {gender.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              gender: c.value
                            })
                          }
                          className={`flex-1 px-3 py-2 rounded-xl border text-[13px] font-semibold
                            ${
                              form.gender === c.value
                                ? "bg-brand-200 border-brand-500 text-txtcolor-700"
                                : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                            }
                          `}
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="flex flex-col gap-3 pb-7 border-b border-txtcolor-200">
                  <h3 className="flex items-center text-[16px] font-bold text-txtcolor-700 mb-2">
                    <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />🔎 상세 정보
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {/* 체중 */}
                    <div>
                      <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                        체중 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                        type="text"
                        value={form.weight}
                        onChange={(e) => {
                          let value = e.target.value

                          value = value.replace(/[^0-9.]/g, "")

                          const parts = value.split(".")
                          if (parts.length > 2) {
                            value = parts[0] + "." + parts[1]
                          }

                          if (parts[1]?.length > 1) {
                            value = parts[0] + "." + parts[1].slice(0, 1)
                          }

                          setForm({
                            ...form,
                            weight: value
                          })
                        }}
                        placeholder="무게를 입력하세요"
                        className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[14px] text-txtcolor-700
                                  focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                      />

                      {form.weight && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-txtcolor-300">
                          kg
                        </span>
                      )}
                      </div>
                    </div>

                    {/* 중성화 */}
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
                </div>

                {/* 생활 정보 */}
                <div className="flex flex-col gap-3">
                  <h3 className="flex items-center text-[16px] font-bold text-txtcolor-700 mb-2">
                    <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />🏡 생활 정보
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {/* 활동량 */}
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

                    {/* 선호 산책 시간 */}
                    <div>
                      <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                        선호 산책 시간 <span className="text-red-500">*</span>
                      </label>

                      <div className="relative" ref={walkTimeRef}>
                        <button
                          type="button"
                          onClick={() => setOpenWalkTime(!openWalkTime)}
                          className={`w-full px-3 py-3 rounded-xl border border-txtcolor-50
                                      bg-txtcolor-50/50 text-left text-[14px]
                                      hover:bg-txtcolor-100/40 transition
                                      ${form.favorWalkTime.length > 0 ? "text-txtcolor-700" : "text-gray-400"}
                                      ${openWalkTime ? "outline outline-2 outline-brand-300" : ""}`}
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
                                  className={`w-[95px] px-3 py-2 rounded-lg border text-[12px] 
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

                    {/* 건강 특이사항 */}
                    <div>
                      <label className="block text-[14px] font-semibold text-txtcolor-700">
                        건강 특이사항 <span className="text-txtcolor-300">(선택)</span>
                      </label>
                      <textarea
                        name="healthNotes"
                        value={form.healthNotes}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 text-[14px] text-txtcolor-700
                                  focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                        placeholder="건강 특이사항 (선택)"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {error && (
                <p className="mb-6 text-[12px] text-danger">
                  {error}
                </p>
              )}
              
              {/* 회원가입 완료 및 반려견 프로필 추가 버튼 */}
              <div className="w-full flex gap-2 mt-7 ">
                  <button type="button" onClick={handleAdd} 
                          className="flex-1 py-3 rounded-xl bg-brand-300 text-txtcolor-700 text-[16px] font-bold
                                    shadow-sm hover:bg-brand-400 transition">
                    프로필 추가
                  </button>
                  <button type="submit" disabled={loading} 
                          className="flex-1 py-3 rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[16px] font-bold
                                    shadow-sm hover:bg-txtcolor-200/80 transition">
                    {loading ? "등록 중..." : "완료"}
                  </button>
              </div>

              <button type="button" onClick={handleSkip} className="mt-3 text-[12px] text-txtcolor-400 no-underline">나중에 등록하기</button>
          </form>
          )}

        </section>
      </div>
    </div>
  )
}

export default DogProfile
