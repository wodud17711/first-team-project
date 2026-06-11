


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useState } from "react"

import { changePassword } from "../../../api/users"

function ChangePassword() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    const isApiReady = false

    const [form, setForm] = useState({
      currentPassword: "",
      newPassword: "",
      newPassword2: "",
    })

    // 비밀번호 표시 여부 (필드명별 토글)
    const [visible, setVisible] = useState({})

    const [error, setError] = useState("")

    const [submitting, setSubmitting] = useState(false)

    
    // input 코드(비번 입력란) 줄이기 위해 사용
    const inputs = [
        { label: "현재 비밀번호", name: "currentPassword", type: "password", placeholder: "현재 비밀번호를 입력하세요" },
        { label: "새 비밀번호", name: "newPassword", type: "password", placeholder: "새 비밀번호를 입력하세요" },
        { label: "새 비밀번호 재확인", name: "newPassword2", type: "password", placeholder: "새 비밀번호를 다시 입력하세요" },
    ]

    // 메뉴 함수
    const accountSettings = [
        { label: "회원정보 수정", path:"/account/edit" },
        { label: "비밀번호 변경", path:"/change-password" },
        { label: "회원 탈퇴", path:"/account/delete" },
    ]

    const myActivities = [
        { label: "내가 작성한 게시글", path: "/mypage/posts" },
        { label: "내가 작성한 댓글", path: "/mypage/comments" },
        { label: "좋아요한 게시글", path: "/mypage/likes" },
    ]

    const handleChange = (e) => {
      const { name, value } = e.target

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }))

      setError("")
    }

    // 다음에 변경 클릭 시, 경고창 + 페이지 이동
    const handleGoDetail = () => {
      const confirmMove = window.confirm(
        "변경사항이 저장되지 않을 수 있습니다!\n취소하시겠습니까?"
      )
  
      if (confirmMove) {
        navigate(`/mypage`)
      }
    }

    const handleSubmit = async (e) => {
      e?.preventDefault()

      if (!isApiReady) return

      if (
        !form.currentPassword.trim() ||
        !form.newPassword.trim() ||
        !form.newPassword2.trim()
      ) {
        setError("모든 항목을 입력해주세요.")
        return
      }

      if (form.newPassword !== form.newPassword2) {
        setError("새 비밀번호가 일치하지 않습니다.")
        return
      }

      setError("")

      try {
        setSubmitting(true)

        await changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })

        alert("비밀번호가 변경되었습니다.")
        navigate("/mypage")
      } catch (err) {
        console.error(err)
        setError("비밀번호 변경에 실패했습니다.")
      } finally {
        setSubmitting(false)
      }
    }

    // 👉 로딩/빈 데이터 상태 UI
    if (loading) {
        return (
        <div className="p-6 text-center text-gray-500">
            불러오는 중...
        </div>
        )
    }
    
    if (!me) {
        return (
        <div className="p-6 text-center text-gray-500">
            계정 정보를 가져오는데 문제가 생겼어요! 🐶
            <div className="mt-4">
            <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-sky-500 text-white rounded-xl"
            >
                홈으로
            </button>
            </div>
        </div>
        )
    }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            비밀번호 변경
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              주기적인 비밀번호 변경을 통해 계정을 안전하게 보호하세요.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>

      <div className="flex flex-col items-center space-y-6">        
            <div className="flex items-stretch gap-6 w-full">
                {/* 유저 프로필 + 메뉴(왼쪽) */}
                <div className="relative shrink-0 w-[350px] flex flex-col gap-3">
                    {/* 유저 프로필 */}
                    <div className="flex flex-col items-center justify-center p-[10px]">
                        <img
                        src={me?.profileImageUrl || "/userpanel/humanProfile.png"}
                        className="w-[130px] h-[130px] mb-2 rounded-full object-cover shadow-md"
                        />
                        <h2 className="text-[20px] font-bold">{me?.nickname}</h2>
                        <p className="text-[14px] text-gray-400">{me?.email}</p>
                    </div>
                    
                    {/* 메뉴 */}
                    <div className="">
                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-sky-900 mb-4">
                                🔐 계정 설정
                            </h3>

                            <div className="divide-y divide-gray-300/70">
                                {accountSettings.map((info) => (
                                <div
                                    key={info.label}
                                    onClick={() => navigate(info.path)}
                                    className="flex items-center justify-between py-4 cursor-pointer hover:text-sky-700 transition"
                                >
                                    <span className="text-[14px]">{info.label}</span>
                                    <span>›</span>
                                </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-sky-900 mb-4">
                                🔎 나의 활동
                            </h3>

                            <div className="divide-y divide-gray-300/70">
                                {myActivities.map((info) => (
                                <div
                                    key={info.label}
                                    onClick={() => navigate(info.path)}
                                    className="flex items-center justify-between py-4 cursor-pointer hover:text-sky-700 transition"
                                >
                                    <span className="text-[14px]">{info.label}</span>
                                    <span>›</span>
                                </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 정보(오른쪽) */}
                <div className="flex flex-col w-full gap-4">
                    <div className="bg-white rounded-xl border shadow-sm px-6 py-5">
                        {/* 타이틀 */}
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="flex items-center text-[20px] font-bold text-sky-900">
                            <span className="w-1 h-[40px] bg-sky-700 rounded-full mr-2" />
                            <div className="flex flex-col">
                              <h1 className="text-[20px] font-bold flex items-center gap-2">
                                <img src='/lockimg.png' alt='비밀번호 변경' className='w-[20px] h-[20px]'/>
                                계정 보호를 위해 비밀번호를 변경해주세요
                              </h1>
                              <p className="px-[2px] text-[12px] text-txtcolor-400">
                              비밀번호는 8~20자로 되어야합니다.(영문, 숫자, 특수문자 포함)
                              </p>
                            </div>
                          </h3>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <form onSubmit={handleSubmit} 
                                className="flex flex-col items-center">
                              {/* 비번 입력칸 */}
                              <div className="w-full flex flex-col gap-3">
                                  {inputs.map((item) => {
                                    const isPassword = item.type === "password"
                                    const shown = !!visible[item.name]
                                    return (
                                      <div key={item.name}>
                                        <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                                          {item.label}
                                          <span className="text-red-500"> *</span>
                                        </label>

                                        <div className="relative">
                                          <input
                                            type={isPassword && shown ? "text" : item.type}
                                            name={item.name}
                                            placeholder={item.placeholder}
                                            value={form[item.name]}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-4 ${
                                              isPassword ? "pr-11" : ""
                                            } bg-[#f7f7f7] rounded-xl text-[14px]
                                            focus:outline-brand-300 hover:bg-[#F0F0F0] transition`}
                                          />

                                          {isPassword && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setVisible((v) => ({
                                                  ...v,
                                                  [item.name]: !v[item.name],
                                                }))
                                              }
                                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px]"
                                            >
                                              {shown ? "🙈" : "👁"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                              </div>
                              {error && (
                              <p className="mt-6 text-[12px] text-danger">
                                  {error}
                              </p>
                              )}                              
                          </form>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-2 mb-1 border-t">
                        <button disabled
                        className="px-4 py-2 w-[140px] bg-sky-500 text-white text-[14px] font-bold rounded-xl hover:bg-sky-600 transition"
                        >
                        비밀번호 변경 (준비 중)
                        </button>

                        <button onClick={handleGoDetail}
                        className="px-4 py-2 w-[140px] bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 transition"
                        >
                        나중에 변경하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ChangePassword
