

function Login() {
  return (
    <div className="flex flex-col items-center space-y-6">
      

      <section className="w-[400px] bg-white rounded-xl px-8 py-12 shadow">
        
        <form className="flex flex-col items-center">
            <h1 className="text-[24px] font-bold">로그인</h1>
            {/* 아이디, 비번 입력칸 */}
            <div className="w-full mt-4 flex flex-col gap-2">
                <input type="text" placeholder="이메일을 입력하세요"
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="password" placeholder="비밀번호를 입력하세요"
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
            </div>

            {/* 로그인 유지 */}
            <div className="w-full mt-2 ml-2 flex justify-between text-[12px] text-txtcolor-400">
                <label className="flex gap-1">
                    <input type="checkbox" className="accent-brand-400"/>
                    <p>로그인 상태 유지</p>
                </label>
            </div>
            
            {/* 로그인 버튼 */}
            <div className="w-full mt-6 flex flex-col gap-2">
                <button className="py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">로그인</button>
            </div>

            {/* 이멜/비번찾기 및 회원가입 */}
            <div className="w-full mt-2 flex items-center justify-center text-[12px] text-txtcolor-400">
                <div className="flex items-center gap-3 ">
                    <button>이메일 찾기</button>
                    <div className="flex-1 w-px h-3 bg-txtcolor-200"/>
                    <button>비밀번호 찾기</button>
                    <div className="flex-1 w-px h-3 bg-txtcolor-200"/>
                    <button>회원가입</button>
                </div>
            </div>
            
            <div className="w-full flex items-center gap-3 my-10">
                <div className="flex-1 h-px bg-txtcolor-200"/>
                <p className="px-3 text-[12px] text-txtcolor-400">SNS 계정으로 로그인</p>
                <div className="flex-1 h-px bg-txtcolor-200"/>
            </div>
            

            {/* SNS 계정 로그인 */}
            <div className="flex gap-6">
                <button>
                    <img src="/loginIcon/naver.png" className="w-[60px] h-[60px]"/>
                </button>
                <button className="flex items-center justify-center
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
  )
}

export default Login