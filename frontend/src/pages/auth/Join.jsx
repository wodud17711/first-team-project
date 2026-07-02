import { useState } from "react"
import { Link } from "react-router-dom"

import { useSignup } from "../../hooks/useSignup"


function Join() {

    // 회원가입 훅 연결(반려견 프로필 등록 버튼 눌렀을 때 '/dog-profile' 페이지로 넘어가도록)
    const {
      form, handleChange, handleSubmit, loading, error,
      emailAuth, handleSendCode, handleVerifyCode, handleCodeChange,
    } = useSignup({ redirectTo: '/dog-profile'})

    // 비밀번호 표시 여부 (필드명별 토글)
    const [visible, setVisible] = useState({})

    
    // input 코드(사용자 정보 입력란) 줄이기 위해 사용
    const inputs = [
        { label: "이메일", name: "email", type: "text", placeholder: "이메일을 입력하세요" },
        { label: "비밀번호", name: "password", type: "password", placeholder: "비밀번호를 입력하세요" },
        { label: "비밀번호 재확인", name: "password2", type: "password", placeholder: "비밀번호를 다시 입력하세요" },
        { label: "닉네임", name: "nickname", type: "text", placeholder: "사용할 닉네임을 입력하세요" }
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

        <section className="w-full max-w-[400px] bg-white rounded-xl border border-txtcolor-100/50
                            px-8 py-12 shadow-sm">
          
          <form onSubmit={handleSubmit} 
                className="flex flex-col items-center">
              <h1 className="text-[24px] text-txtcolor-700 font-extrabold mb-6">회원가입</h1>

              {/* 회원가입 단계표시 */}
              <div className="w-full mb-6 flex items-center justify-center">
                <div className="flex items-center text-[13px] font-medium">

                  <div className="flex flex-col items-center">
                    <div className="
                      w-7 h-7 rounded-full
                      bg-brand-300 text-txtcolor-700 font-bold
                      flex items-center justify-center
                    ">
                      1
                    </div>
                    <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-500 font-bold">계정 생성</p>
                  </div>

                  <div className="w-10 h-px bg-txtcolor-200 mx-1 self-start mt-[14px]" />

                  <div className="flex flex-col items-center">
                    <div className="
                      w-7 h-7 rounded-full
                      bg-txtcolor-100/50 text-txtcolor-400 font-bold
                      flex items-center justify-center
                    ">
                      2
                    </div>
                    <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-300">반려견 프로필</p>
                  </div>

                  <div className="w-10 h-px bg-txtcolor-200 mx-1 self-start mt-[14px]" />

                  <div className="flex flex-col items-center">
                    <div className="
                      w-7 h-7 rounded-full
                      bg-txtcolor-100/50 text-txtcolor-400 font-bold
                      flex items-center justify-center
                    ">
                      3
                    </div>
                    <p className="w-[80px] flex justify-center mt-1 text-[12px] text-txtcolor-300">완료</p>
                  </div>
                </div>
              </div>

              {/* 사용자 정보 입력칸 */}
              <div className="w-full mt-4 flex flex-col gap-4">
                  {inputs.map((item) => {
                    const isPassword = item.type === "password"
                    const isEmail = item.name === "email"
                    const shown = !!visible[item.name]
                    return (
                      <div key={item.name}>
                        <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                          {item.label}
                          <span className="text-red-500"> *</span>
                        </label>

                        <div className={isEmail ? "flex gap-2" : "relative"}>
                          <input
                            type={isPassword && shown ? "text" : item.type}
                            name={item.name}
                            placeholder={item.placeholder}
                            value={form[item.name]}
                            onChange={handleChange}
                            disabled={isEmail && emailAuth.verified}
                            className={`w-full px-3 py-3 ${isPassword ? "pr-11" : ""} bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                              text-txtcolor-700 text-[14px]
                              focus:outline-brand-300 hover:bg-txtcolor-100/40 transition
                              ${isEmail ? "flex-1 disabled:opacity-60" : ""}`}
                          />

                          {isEmail && (
                            <button
                              type="button"
                              onClick={handleSendCode}
                              disabled={emailAuth.sending || emailAuth.verified}
                              className="shrink-0 px-3 rounded-xl bg-brand-300 text-txtcolor-700
                                        text-[13px] font-semibold shadow-sm hover:bg-brand-400
                                        transition disabled:opacity-60"
                            >
                              {emailAuth.verified ? "인증 완료" : emailAuth.sending ? "발송 중..." : emailAuth.sent ? "재발송" : "인증코드 발송"}
                            </button>
                          )}

                          {isPassword && (
                            <button
                              type="button"
                              onClick={() =>
                                setVisible((v) => ({ ...v, [item.name]: !v[item.name] }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-full"
                            >
                              {shown ? "🙈" : "👁"}
                            </button>
                          )}
                        </div>

                        {/* 인증 코드 입력 (발송 후 ~ 인증 완료 전) */}
                        {isEmail && emailAuth.sent && !emailAuth.verified && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="인증 코드 6자리"
                              value={emailAuth.code}
                              onChange={handleCodeChange}
                              className="flex-1 px-3 py-3 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50
                                        text-txtcolor-700 text-[14px] tracking-widest
                                        focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyCode}
                              disabled={emailAuth.verifying}
                              className="shrink-0 px-4 rounded-xl bg-txtcolor-700 text-white
                                        text-[13px] font-semibold shadow-sm hover:bg-txtcolor-900
                                        transition disabled:opacity-60"
                            >
                              {emailAuth.verifying ? "확인 중..." : "확인"}
                            </button>
                          </div>
                        )}

                        {isEmail && emailAuth.notice && (
                          <p className="mt-1 text-[12px] text-txtcolor-400">{emailAuth.notice}</p>
                        )}
                        {isEmail && emailAuth.error && (
                          <p className="mt-1 text-[12px] text-danger">{emailAuth.error}</p>
                        )}
                      </div>
                    )
                  })}
              </div>

              <div>
                <label className="block mt-4 mb-1 text-[14px] font-semibold text-gray-700">
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
                      className={`flex-1 flex justify-center px-3 py-3 
                                      rounded-xl border text-center border text-[13px] font-semibold ${
                                        form.guardianLevel === level.value
                                        ? "bg-brand-200 border-brand-500 text-txtcolor-700"
                                        : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                                    }`}
                    >
                      <div>
                        <div className="text-[13px] font-semibold">
                          {level.label[0]} <br /> {level.label[1]}
                        </div>

                        <div className={`text-[11px] ${
                            form.guardianLevel === level.value
                            ? "text-txtcolor-500"
                            : "text-txtcolor-200"
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
              <div className="w-full mt-7 flex flex-col gap-2">
                  <button type="submit" disabled={loading} 
                          className="py-3 bg-txtcolor-700 text-white text-[16px] font-bold
                                rounded-xl shadow-sm transition hover:bg-txtcolor-900">
                    {loading ? '가입 중...' : '가입하고 반려견 등록하기'}
                  </button>
              </div>
              {/* 버튼 밑 공지글 */}
              <div className="w-full mt-2 flex items-center justify-center 
                              text-[12px] text-txtcolor-400">
                  <p>가입은 지금 완료돼요. 반려견 프로필은 나중에도 추가할 수 있어요.</p>
              </div>

          </form>
          
        </section>

      </div>
    </div>
  )
}

export default Join