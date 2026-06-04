import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCreateDog } from "../hooks/useCreateDog";



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
      hairlength: "",
      favorwalktime: [],
      health: "",
    }
    const [form, setForm] = useState(initialForm)

    // 추가한 반려견 프로필 정보들 저장
    const [addedDogs, setAddedDogs] = useState([])


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
    

    // input들을 한 함수로 다 처리하는 역할
    // 사용자가 입력한 값 value를 form 객체의 해당 필드에 넣어주는 함수
    const handleChange = (e) => {   // input에서 발생한 이벤트(e)를 받음
        const {name, value} = e.target   // name: 어떤 input인지, value: 사용자가 입력한 값
        setForm({
            ...form,   // 기존 form 다 복사
            [name]: value   // name에 해당하는 값만 바꾸기
        })
    }

    // 백엔드에 보낼 데이터 형태 변환
    const toPayload = () => ({
      name: form.dogname,
      birthDate: form.dogbirth || null,
      breedId: form.breedId || null,
      gender: form.gender || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      hairLength: form.hairlength ?? null,
      favorWalkTime: form.favorwalktime ?? [],
      healthNotes: form.health || null,
    })

    // 완료 눌렀을 때 
    const handleDone = async (e) => {
      e.preventDefault()

      const dog = await create(toPayload())
      if (!dog) return

      navigate("/login")
    }

    // 프로필 추가 눌렀을 때
    const handleAdd = async () => {
      const dog = await create(toPayload())
      if (!dog) return

      setAddedDogs((prev) => [...prev, dog])
      setForm(initialForm)
    }

    // 나중에 하기 눌렀을 때
    const handleSkip = () => {
      navigate("/login")
    }


    // 털길이 선택 버튼 코드 줄이기 위해 사용
    const hairlength = [
        { value: "단모종", title: "단모", desc: "짧고 매끈" },
        { value: "장모종", title: "장모", desc: "길고 풍성" }
    ]

    // 성별 선택 버튼
    const gender = [
      { value: "M", title: "남아", desc: "" },
      { value: "F", title: "여아", desc: "" }
    ]

    // 정보 입력칸 성격별 분리
    const sections = [
      { title: "기본 정보", fields: ["dogname", "dogbirth", "breedId", "gender"] },
      { title: "상세 정보", fields: ["weight", "hairlength"] },
      { title: "생활 정보", fields: ["favorwalktime", "health"] }
    ]

    


  return (
    <div className="flex flex-col items-center space-y-6">
      
      <section className="w-[400px] bg-white rounded-xl px-8 py-12 shadow">
        
        <form onSubmit={handleDone} 
              className="flex flex-col items-center">
            <h1 className="text-[24px] font-bold mb-1">반려견 프로필 등록</h1>

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
            <div className="w-full mb-2 flex items-center justify-center">
              <div className="flex items-center text-[13px] font-medium">

                <div className="flex flex-col items-center">
                  <div className="
                    w-7 h-7 rounded-full
                    bg-brand-200 text-brand-700 font-bold
                    flex items-center justify-center
                  ">
                    1
                  </div>
                  <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-400">회원가입</p>
                </div>

                <div className="w-10 h-px bg-brand-300 mx-1 self-start mt-[14px]" />

                <div className="flex flex-col items-center">
                  <div className="
                    w-7 h-7 rounded-full
                    bg-brand-500 text-white font-bold
                    flex items-center justify-center
                  ">
                    2
                  </div>
                  <p className="w-[80px] flex justify-center mt-1 text-[12px] text-brand-500 font-bold">반려견 프로필</p>
                </div>

                <div className="w-10 h-px bg-brand-300 mx-1 self-start mt-[14px]" />

                <div className="flex flex-col items-center">
                  <div className="
                    w-7 h-7 rounded-full
                    bg-gray-200 text-gray-500 font-bold
                    flex items-center justify-center
                  ">
                    3
                  </div>
                  <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-400">완료</p>
                </div>
              </div>
            </div>


            <div className="w-full mt-6 flex flex-col gap-6">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3 pb-6 border-b border-gray-200 last:border-b-0">
                {/* 섹션 제목 */}
                <p className="ml-1 text-[16px] font-bold text-txtcolor-700">
                  {section.title}
                </p>

                {/* 필드들 */}
                {section.fields.map((item) => (
                  <div key={item}>

                    {/* 성별 선택 */}
                    {item === "gender" ? (
                      <div className="flex gap-2">
                      {gender.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, gender: c.value })
                          }
                          className={`flex-1 px-3 py-3 rounded-xl border text-[14px]
                            ${form.gender === c.value
                              ? "bg-brand-200 border-brand-500"
                              : "bg-white border-gray-200"
                            }`}
                        >
                          <div>{c.title}</div>
                          <div className="text-[12px] text-gray-400">
                            {c.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                    // 체중 입력
                    ): item === "weight" ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="weight"
                          placeholder="무게를 입력하세요"
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
                          className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[14px]
                                    focus:outline-brand-300 hover:bg-[#F0F0F0]"
                        />

                        {form.weight && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            kg
                          </span>
                        )}
                      </div>

                    ) : item === "favorwalktime" ? (
                      <div className="relative" ref={walkTimeRef}>
                        <button
                          type="button"
                          onClick={() => setOpenWalkTime(!openWalkTime)}
                          className={`w-full px-3 py-4 bg-[#f7f7f7] rounded-xl text-left text-[14px]
                                      ${form.favorwalktime.length > 0 ? "text-black" : "text-gray-400"}
                                      ${openWalkTime ? "outline outline-2 outline-brand-300" : ""}`}
                        >
                          {form.favorwalktime.length > 0
                            ? form.favorwalktime.join(", ")
                            : "선호 산책 시간을 선택하세요"}
                        </button>

                        {openWalkTime && (
                          <div className="absolute top-full mt-2 w-full bg-white border rounded-xl px-2 py-4 shadow z-10">
                            <div className="flex flex-wrap justify-center gap-2">
                              {walkTimes.map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => handleWalkTime(time)}
                                  className={`px-3 py-2 rounded border text-[12px] 
                                    ${form.favorwalktime.includes(time)
                                      ? "bg-brand-200 border-brand-500"
                                      : "bg-white border-gray-200"
                                    }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    ) : item === "hairlength" ? (
                      <div className="flex gap-2">
                      {hairlength.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, hairlength: c.value })
                          }
                          className={`flex-1 px-3 py-3 rounded-xl border text-[14px]
                            ${form.hairlength === c.value
                              ? "bg-brand-200 border-brand-500"
                              : "bg-white border-gray-200"
                            }`}
                        >
                          <div>{c.title}</div>
                          <div className="text-[12px] text-gray-400">
                            {c.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                  ) : item === "breedId" || item === "dogname" || item === "dogbirth" || item === "health" ? (
                    <input
                      type="text"
                      name={item}
                      value={form[item]}
                      onChange={handleChange}
                      placeholder={
                        item === "dogname"
                          ? "반려견의 이름을 입력하세요"
                          : item === "breedId"
                          ? "견종을 선택하세요"
                          : item === "dogbirth"
                          ? "생년월일(8자리)을 입력하세요"
                          : "건강 특이사항을 입력하세요"
                      }
                      className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl text-[14px]
                                focus:outline-brand-300 hover:bg-[#F0F0F0]"
                    />
                  ) : null}
                  </div>
                  ))}
                </div>
              ))}
            </div>

            {error && (
              <p className="mb-6 text-[12px] text-danger">
                {error}
              </p>
            )}
            
            {/* 회원가입 완료 및 반려견 프로필 추가 버튼 */}
            <div className="w-full flex gap-2">
                <button type="button" onClick={handleAdd} className="flex-1 py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">프로필 추가</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">{loading ? "등록 중..." : "완료"}</button>
            </div>

            <button type="button" onClick={handleSkip} className="mt-3 text-[13px] text-txtcolor-400 no-underline">나중에 등록하기</button>

        </form>
        
      </section>

    </div>
  )
}

export default DogProfile
