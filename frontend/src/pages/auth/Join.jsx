import { useState } from "react"
import { useSignup } from "../../hooks/useSignup"



function Join() {

    // 회원가입 훅 연결(반려견 프로필 등록 버튼 눌렀을 때 '/dog-profile' 페이지로 넘어가도록)
    const { form, handleChange, handleSubmit, loading, error } = useSignup({ redirectTo: '/dog-profile'})

    // 비밀번호 표시 여부 (필드명별 토글)
    const [visible, setVisible] = useState({})

    
    // input 코드(사용자 정보 입력란) 줄이기 위해 사용
    const inputs = [
        { name: "email", type: "text", placeholder: "이메일을 입력하세요" },
        { name: "password", type: "password", placeholder: "비밀번호를 입력하세요" },
        { name: "password2", type: "password", placeholder: "비밀번호를 다시 입력하세요" },
        { name: "nickname", type: "text", placeholder: "사용할 닉네임을 입력하세요" }
    ]

  return (
    <div className="flex flex-col items-center space-y-6">
      
      <section className="w-[400px] bg-white rounded-xl px-8 py-12 shadow">
        
        <form onSubmit={handleSubmit} 
              className="flex flex-col items-center">
            <h1 className="text-[24px] font-bold mb-6">회원가입</h1>

            {/* 회원가입 단계표시 */}
            <div className="w-full mb-2 flex items-center justify-center">
              <div className="flex items-center text-[13px] font-medium">

                <div className="flex flex-col items-center">
                  <div className="
                    w-7 h-7 rounded-full
                    bg-brand-500 text-white font-bold
                    flex items-center justify-center
                  ">
                    1
                  </div>
                  <p className="w-[80px] flex justify-center mt-1 text-[12px] text-brand-500 font-bold">회원가입</p>
                </div>

                <div className="w-10 h-px bg-brand-300 mx-1 self-start mt-[14px]" />

                <div className="flex flex-col items-center">
                  <div className="
                    w-7 h-7 rounded-full
                    bg-gray-200 text-gray-500 font-bold
                    flex items-center justify-center
                  ">
                    2
                  </div>
                  <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-400">반려견 프로필</p>
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

            {/* 사용자 정보 입력칸 */}
            <div className="w-full mt-4 flex flex-col gap-3">
                {inputs.map((item) => {
                  const isPassword = item.type === "password"
                  const shown = !!visible[item.name]
                  return (
                    <div key={item.name} className="relative">
                      <input
                        type={isPassword && shown ? "text" : item.type}
                        name={item.name}
                        placeholder={item.placeholder}
                        value={form[item.name]}
                        onChange={handleChange}
                        className={`w-full px-3 py-4 ${isPassword ? "pr-11" : ""} bg-[#f7f7f7] rounded-xl text-[14px]
                                focus:outline-brand-300 hover:bg-[#F0F0F0] transition`}
                      />
                      {isPassword && (
                        <button
                          type="button"
                          onClick={() => setVisible((v) => ({ ...v, [item.name]: !v[item.name] }))}
                          aria-label={shown ? "비밀번호 숨기기" : "비밀번호 표시"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] leading-none"
                        >
                          {shown ? "🙈" : "👁"}
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>

            <div>
              <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                보호자 연차 <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-2">
                {[
                  { value: "BEGINNER", label: ["새싹", "보호자🌱"], desc: "(~1년)" },
                  { value: "JUNIOR", label: ["초보", "보호자🦴"], desc: "(1~3년)" },
                  { value: "SENIOR", label: ["숙련", "보호자🐕"], desc: "(3~5년)" },
                  { value: "VETERAN", label: ["베테랑", "보호자🏆"], desc: "(5년+)" }
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: {
                          name: "guardianLevel",
                          value: level.value
                        }
                      })
                    }
                    className={`flex-1 flex justify-center px-3 py-4 rounded-xl border text-center transition ${
                      form.guardianLevel === level.value
                        ? "bg-brand-200 border-brand-500"
                        : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0]"
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-medium">
                        {level.label[0]} <br /> {level.label[1]}
                      </div>

                      <div
                        className={`text-[11px] ${
                          form.guardianLevel === level.value
                            ? "text-brand-600"
                            : "text-gray-400/80"
                        }`}
                      >
                        {level.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
            <p className="mt-6 text-[12px] text-danger">
                {error}
            </p>
            )}
            
            {/* 반려견 프로필 등록 버튼 */}
            <div className="w-full mt-6 flex flex-col gap-2">
                <button type="submit" disabled={loading} className="py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">{loading ? '가입 중...' : '가입하고 반려견 등록하기'}</button>
            </div>
            {/* 버튼 밑 공지글 */}
            <div className="w-full mt-2 flex items-center justify-center 
                            text-[12px] text-txtcolor-400">
                <p>가입은 지금 완료돼요. 반려견 프로필은 나중에도 추가할 수 있어요.</p>
            </div>

        </form>
        
      </section>

    </div>
  )
}

export default Join