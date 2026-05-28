import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"



function DogProfile() {

    // 페이지 이동
    const navigate = useNavigate()

    // 반려견 정보 입력값 저장하는 저장소역할
    const [form, setForm] = useState({
        dogname:"",
        breed:"",
        dogbirth:"",
        weight:"",
        hairlength:"",
        favorwalktime:[], // 중복 선택 가능하게 배열로
        health:"",
    })


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

    // '반려견 프로필 등록' 버튼 눌렀을 때, 페이지의 새로고침 방지 및 입력값 확인하는 함수
    const handleSubmit = (e) => {
        e.preventDefault()  // 새로고침 막는 것
        console.log(form)   // 현재 입력된 값 전체 출력

        navigate("/dog-profile")  // 반려견 프로필 등록 페이지로 이동
    }



    // input 코드(사용자 정보 입력란) 줄이기 위해 사용
    const inputs = [
        { name: "dogname", type: "text", placeholder: "반려견의 이름을 입력하세요" },
        { name: "breed", type: "text", placeholder: "견종을 선택하세요" },
        { name: "dogbirth", type: "text", placeholder: "생년월일(8자리)을 입력하세요" },
        { name: "weight", type: "text", placeholder: "무게를 입력하세요" },
        { name: "favorwalktime", type: "text", placeholder: "선호 산책 시간을 선택하세요" },
        { name: "health", type: "text", placeholder: "건강 특이사항을 입력하세요" }
    ]

    // 털길이 선택 버튼 코드 줄이기 위해 사용
    const hairlength = [
        { value: "단모종", title: "단모", desc: "짧고 매끈" },
        { value: "중모종", title: "중모", desc: "적당히 복슬" },
        { value: "장모종", title: "장모", desc: "길고 풍성" }
    ]


  return (
    <div className="flex flex-col items-center space-y-6">
      
      <section className="w-[400px] bg-white rounded-xl px-8 py-12 shadow">
        
        <form onSubmit={handleSubmit} 
              className="flex flex-col items-center">
            <h1 className="text-[24px] font-bold mb-1">반려견 프로필 등록</h1>
            {/* 버튼 밑 공지글 */}
            <div className="w-full flex items-center justify-center 
                            text-[12px] text-txtcolor-400">
                <p>반려견에게 알맞는 정보를 제공하기 위해 사용됩니다</p>
            </div>
            <div className="w-full mb-6 flex items-center justify-center 
                            text-[12px] text-txtcolor-400">
                <p>프로필은 나중에도 추가할 수 있어요(완료 클릭 시 스킵가능)</p>
            </div>

            {/* 반려견 정보 입력칸 */}
            <div className="w-full mt-4 flex flex-col gap-3">
                {inputs.map((item) => (
                  <div key={item.name}>

                    {/* weight일 때 */}
                    {item.name === "weight" ? (
                    <div className="relative">
                      <input
                        type="text"
                        name="weight"
                        placeholder={item.placeholder}
                        value={form.weight}
                        onChange={(e) => {
                          let value = e.target.value

                          // 숫자 + 점만 허용
                          value = value.replace(/[^0-9.]/g, "")

                          // 점 여러개 방지
                          const parts = value.split(".")
                          if (parts.length > 2) {
                            value = parts[0] + "." + parts[1]
                          }

                          // 소수점 첫째자리까지만
                          if (parts[1]?.length > 1) {
                            value = parts[0] + "." + parts[1].slice(0, 1)
                          }

                          setForm({
                            ...form,
                            weight: value
                          })
                        }}
                        className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[14px]
                                  focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                      />

                      {/* 값 있을 때만 kg 표시 */}
                      {form.weight && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">
                          kg
                        </span>
                      )}
                    </div>

                    // 선호 산책 시간일 때
                    ) : item.name === "favorwalktime" ? (
                    <div className="relative" ref={walkTimeRef}>
                      {/* 인풋처럼 보이게 */}
                      <button
                        type="button"
                        onClick={() => setOpenWalkTime(!openWalkTime)}
                        className={`w-full px-3 py-4 bg-[#f7f7f7] rounded-xl text-left text-[14px]
                                    hover:bg-[#F0F0F0]
                                    ${openWalkTime ? "outline outline-2 outline-brand-300" : ""}
                                    ${form.favorwalktime.length > 0 ? "text-black" : "text-gray-400"}
                                  `}
                      >
                        {form.favorwalktime.length > 0
                          ? form.favorwalktime.join(", ")
                          : "선호 산책 시간을 선택하세요"}
                      </button>

                      {/* 클릭 시 목록 */}
                      {openWalkTime && (
                        <div className="absolute top-full mt-2 w-full bg-white border rounded-xl px-2 py-5 shadow z-10">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {walkTimes.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleWalkTime(time)}
                                className={`px-3 py-2 rounded-lg border text-[12px]
                                  ${
                                    form.favorwalktime.includes(time)
                                      ? "bg-brand-200 border-brand-500"
                                      : "bg-white border-gray-200"
                                  }
                                `}
                              >
                                {time}
                              </button>
                            ))}

                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    
                      // 일반 input일 때
                      <input
                        key={item.name}
                        type={item.type}
                        name={item.name}
                        placeholder={item.placeholder}
                        value={form[item.name]}
                        onChange={handleChange}
                        className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl text-[14px]
                                focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                      />
                    )}
                  </div>
                ))}

                {/* 반려견 털길이 선택 */}
                <div className="w-full mt-2 flex flex-col gap-2">
                    <p className="text-[14px] text-txtcolor-700 font-bold">털길이 선택</p>
                    <div className="flex gap-2">
                        {hairlength.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setForm({ ...form, hairlength: c.value })}
                            className={`w-1/3 flex flex-col items-center justify-center
                            px-3 py-3 rounded-xl border text-[14px] transition
                            ${form.hairlength === c.value
                                ? "bg-brand-200 border-brand-500 hover:bg-brand-200"
                                : "bg-white border-txtcolor-200 hover:bg-[#F0F0F0] hover:border-txtcolor-200"
                            }`}
                        >
                            <span className="text-[16px] text-txtcolor-400">{c.icon}</span>
                            <span className="text-[14px] text-txtcolor-700">{c.title}</span>
                            <span className="text-[12px] text-txtcolor-400">({c.desc})</span>
                        </button>
                        ))}
                    </div>

                    
                </div>
            </div>
            
            {/* 회원가입 완료 및 반려견 프로필 추가 버튼 */}
            <div className="w-full mt-6 flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">프로필 추가</button>
                <button type="submit" className="flex-1 py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">완료</button>
            </div>

        </form>
        
      </section>

    </div>
  )
}

export default DogProfile
