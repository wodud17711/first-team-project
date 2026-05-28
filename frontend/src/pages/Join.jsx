import { useSignup } from "../hooks/useSignup"



function Join() {
    
    // 회원가입 훅 연결(반려견 프로필 등록 버튼 눌렀을 때 '/dog-profile' 페이지로 넘어가도록)
    const { form, handleChange, handleSubmit, loading, error } = useSignup({ redirectTo: '/dog-profile'})

    
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

            {/* 사용자 정보 입력칸 */}
            <div className="w-full mt-4 flex flex-col gap-3">
                {inputs.map((item) => (
                <input
                    key={item.name}
                    type={item.type}
                    name={item.name}
                    placeholder={item.placeholder}
                    value={form[item.name]}
                    onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl text-[14px]
                            focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                />
                ))}
            </div>

            {error && (
            <p className="mt-6 text-[12px] text-danger">
                {error}
            </p>
            )}
            
            {/* 반려견 프로필 등록 버튼 */}
            <div className="w-full mt-6 flex flex-col gap-2">
                <button type="submit" disabled={loading} className="py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">{loading ? '가입 중...' : '반려견 프로필 등록'}</button>
            </div>
            {/* 버튼 밑 공지글 */}
            <div className="w-full mt-2 flex items-center justify-center 
                            text-[12px] text-txtcolor-400">
                <p>반려견 프로필 등록 후 회원가입이 완료됩니다!</p>
            </div>

        </form>
        
      </section>

    </div>
  )
}

export default Join