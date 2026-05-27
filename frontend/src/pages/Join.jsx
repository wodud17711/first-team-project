import { useState } from "react"
import { useNavigate } from "react-router-dom"


function Join() {

    // 페이지 이동
    const navigate = useNavigate()

    // 사용자 정보 입력값 저장하는 저장소역할
    const [form, setForm] = useState({
        email:"",
        password:"",
        password2:"",
        nickname:"",
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

        // 비밀번호 재확인 검증(후에 API 붙이면서 error state로 변경하기)
        if (form.password !== form.password2){
            alert("비밀번호가 일치하지 않습니다!")
            return
        }
        // 나중에 닉네임 2~20자 검증도 추가하기

        console.log(form)   // 현재 입력된 값 전체 출력

        navigate("/dog-profile")  // 반려견 프로필 등록 페이지로 이동
    }



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
            <div>

            </div>
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
            
            {/* 반려견 프로필 등록 버튼 */}
            <div className="w-full mt-6 flex flex-col gap-2">
                <button type="submit" className="py-3 bg-brand-300 rounded-xl 
                                   text-[16px] font-bold text-txtcolor-900">반려견 프로필 등록</button>
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