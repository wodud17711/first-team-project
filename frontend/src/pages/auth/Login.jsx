import { useState } from "react"
import { Link } from "react-router-dom"
import { useLogin } from "../../hooks/useLogin"


function Login() {

    // 로그인 훅 연결
    const {form, handleChange, handleSubmit, loading, error} = useLogin()

    // 비밀번호 표시 여부
    const [showPw, setShowPw] = useState(false)

    // 카카오 소셜 로그인: BE authorize 엔드포인트로 이동 → 카카오 인증 → BE 콜백 → /oauth/callback 랜딩
    const handleKakaoLogin = () => {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api"
        window.location.href = `${base}/auth/oauth/kakao/authorize`
    }

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
              <h1 className="text-[24px] text-txtcolor-700 font-extrabold mb-6">로그인</h1>
              {/* 아이디, 비번 입력칸 */}
              <div className="w-full mt-4 flex flex-col gap-2">
                  <input type="text" name="email" placeholder="이메일을 입력하세요"
                        value={form.email} onChange={handleChange}
                      className="px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                                text-txtcolor-700 text-[14px]
                                focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"/>
                  <div className="relative">
                      <input type={showPw ? "text" : "password"} name="password" placeholder="비밀번호를 입력하세요"
                            value={form.password} onChange={handleChange}
                          className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                                    text-txtcolor-700 text-[14px]
                                    focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"/>
                      <button type="button" onClick={() => setShowPw((s) => !s)}
                              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] leading-none">
                          {showPw ? "🙈" : "👁"}
                      </button>
                  </div>
              </div>

              {/* 로그인 유지 */}
              <div className="w-full mt-2 ml-2 flex justify-between text-[12px]">
                  <label className="flex gap-1">
                      <input type="checkbox" name="rememberMe" className="accent-brand-500"
                            checked={form.rememberMe} onChange={handleChange}/>
                      <p className="text-txtcolor-400">로그인 상태 유지</p>
                  </label>
              </div>

              {error && <p className="mt-6 text-[12px] text-danger">{error}</p>}

              {/* 로그인 버튼 */}
              <div className="w-full mt-6 flex flex-col gap-2">
                  <button disabled={loading} type="submit"
                          className="py-3 rounded-xl bg-brand-300 text-txtcolor-700 text-[16px] font-bold
                                    shadow-sm hover:bg-brand-400 transition">
                                      
                    {loading ? '로그인 중...' : '로그인'}
                  </button>
              </div>

              {/* 이멜/비번찾기 및 회원가입 */}
              <div className="w-full mt-2 flex items-center justify-center text-[12px] text-txtcolor-400">
                  <div className="flex items-center gap-3 ">
                      <button>이메일 찾기</button>
                      <div className="flex-1 w-px h-3 bg-txtcolor-200"/>
                      <button>비밀번호 찾기</button>
                      <div className="flex-1 w-px h-3 bg-txtcolor-200"/>
                      <Link to="/join">회원가입</Link>
                  </div>
              </div>
              
              <div className="w-full flex items-center gap-3 mt-10 mb-8">
                  <div className="flex-1 h-px bg-txtcolor-200"/>
                  <p className="px-3 text-[12px] text-txtcolor-400">SNS 계정으로 로그인</p>
                  <div className="flex-1 h-px bg-txtcolor-200"/>
              </div>
              

              {/* SNS 계정 로그인 */}
              <div className="flex gap-6">
                  <button>
                      <img src="/loginIcon/naver.png" className="w-[60px] h-[60px]"/>
                  </button>
                  <button type="button" onClick={handleKakaoLogin}
                          aria-label="카카오로 로그인"
                          className="flex items-center justify-center
                                    bg-[#FEE500] w-[60px] h-[60px] rounded-full">
                      <img src="/loginIcon/kakao.png" className="w-[30px] h-[30px] mt-1"/>
                  </button>
                  <button>
                      <img src="/loginIcon/google.png" className="w-[60px] h-[60px]"/>
                  </button>
              </div>

          </form>
          
        </section>

      </div>
    </div>
  )
}

export default Login