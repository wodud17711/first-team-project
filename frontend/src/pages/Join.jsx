import { useState } from "react"


function Join() {

    // 사용자 정보 입력값 저장하는 저장소역할
    const [form, setForm] = useState({
        email:"",
        password:"",
        password2:"",
        name:"",
        birth:"",
        phone:"",
        nickname:"",
        career:"",
    })

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
    }

  return (
    <div className="flex flex-col items-center space-y-6">
      
      <section className="w-[400px] bg-white rounded-xl px-8 py-12 shadow">
        
        <form onSubmit={handleSubmit} 
              className="flex flex-col items-center">
            <h1 className="text-[24px] font-bold">회원가입</h1>
            <div>

            </div>
            {/* 사용자 정보 입력칸 */}
            <div className="w-full mt-4 flex flex-col gap-2">
                <input type="text" name="email" placeholder="이메일을 입력하세요"
                             value={form.email} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="password" name="password" placeholder="비밀번호를 입력하세요"
                             value={form.password} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="password" name="password2" placeholder="비밀번호를 다시 입력하세요"
                             value={form.password2} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="text" name="name" placeholder="이름(실명)을 입력하세요"
                             value={form.name} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="text" name="birth" inputMode="numeric" placeholder="생년월일(8자리)을 입력하세요"
                             value={form.birth} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="tel" name="phone" placeholder="휴대폰 번호를 입력하세요"
                             value={form.phone} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="text" name="nickname" placeholder="사용할 닉네임을 입력하세요"
                             value={form.nickname} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
                <input type="text" name="career" placeholder="견주 연차를 입력하세요"
                             value={form.career} onChange={handleChange}
                    className="px-3 py-4 bg-[#f7f7f7] rounded-xl focus:outline-brand-300
                               text-[14px] text-txtcolor-900"/>
            </div>
            
            {/* 반려견 프로필 등록 버튼 */}
            <div className="w-full mt-6 flex flex-col gap-2">
                <button className="py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">반려견 프로필 등록</button>
            </div>
            {/* 버튼 밑 공지글 */}
            <div className="w-full mt-2 flex items-center justify-center 
                            text-[12px] text-txtcolor-400 gap-3">
                <p>반려견 프로필 등록 후 회원가입이 완료됩니다!</p>
            </div>

        </form>
        
      </section>

    </div>
  )
}

export default Join