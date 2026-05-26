

function Login() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <h1 className="text-[24px] font-bold">로그인</h1>

      <section className="w-[500px] bg-white rounded-xl p-6 shadow">
        <form className="flex flex-col items-center">
            <div className="w-full flex flex-col gap-2">
                <input type="text" placeholder="이메일을 입력하세요"
                    className="px-3 py-2 border border-black"/>
                <input type="password" placeholder="비밀번호를 입력하세요"
                    className="px-3 py-2 border border-black"/>
            </div>

            <div className="w-full flex justify-between text-[14px]">
                <p>로그인 상태 유지</p>
                <div className="flex gap-3">
                    <button>이메일 찾기</button>
                    <button>비밀번호 찾기</button>
                </div>
            </div>
            
            
            <div className="w-full mt-6 flex flex-col gap-2">
                <button className="py-3 bg-brand-300">로그인</button>
                <button className="py-3 bg-brand-300">회원가입</button>
            </div>
            
            <p>또는</p>

            <div className="flex gap-3">
                <p>네이버</p>
                <p>카카오</p>
                <p>구글</p>
            </div>
            

        </form>
        
        
      </section>

    </div>
  )
}

export default Login