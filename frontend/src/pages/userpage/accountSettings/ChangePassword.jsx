


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useState } from "react"

import { changePassword } from "../../../api/users"

function ChangePassword() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    const isApiReady = true

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
        const code = err?.errorCode
        setError(
          code === "PASSWORD_MISMATCH"
            ? "현재 비밀번호가 일치하지 않습니다."
            : code === "INVALID_INPUT"
              ? "새 비밀번호가 형식에 맞지 않거나 기존 비밀번호와 동일합니다."
              : "비밀번호 변경에 실패했습니다."
        )
      } finally {
        setSubmitting(false)
      }
    }

    // 👉 로딩/빈 데이터 상태 UI
    if (loading) {
        return (
        <div className="p-6 text-center text-txtcolor-300">
            불러오는 중...
        </div>
        )
    }
    
    if (!me) {
        return (
        <div className="p-6 text-center text-txtcolor-500">
            계정 정보를 가져오는데 문제가 생겼어요! 🐶
            <div className="mt-4">
            <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl"
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
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            비밀번호 변경
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              주기적인 비밀번호 변경을 통해 계정을 안전하게 보호하세요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>

      <div className="flex flex-col items-center space-y-6">
            {/* 모바일(<md)은 왼쪽 열 350px 고정 탓에 폼이 폭 0으로 붕괴 → 세로 스택 (MyPage #191 패턴).
                모바일에선 본체인 폼을 먼저(order), 보조 메뉴는 아래로 */}
            <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
                {/* 유저 프로필 + 메뉴(왼쪽) */}
                <div className="relative shrink-0 w-full md:w-[350px] flex flex-col gap-3 order-2 md:order-1">
                    {/* 유저 프로필 */}
                    <div className="flex flex-col items-center justify-center pt-[10px]
                                    w-full md:w-[350px] h-[290px]">
                        <img
                        src={me?.profileImageUrl || "/userpanel/humanProfile.png"}
                        className="w-[180px] h-[180px] mb-2 rounded-full object-cover shadow-md"
                        />
                        <h2 className="text-[20px] font-bold">{me?.nickname}</h2>
                        <p className="text-[14px] text-gray-400">{me?.email}</p>
                    </div>
                    
                    {/* 메뉴 */}
                    <div className="">
                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-txtcolor-700 mb-4">
                                🔐 계정 설정
                            </h3>

                            <div className="divide-y divide-txtcolor-100">
                                {accountSettings.map((info) => (
                                <div
                                    key={info.label}
                                    onClick={() => navigate(info.path)}
                                    className="flex items-center justify-between text-txtcolor-700
                                              py-4 cursor-pointer hover:text-brand-700 transition"
                                >
                                    <span className="text-[14px] ">{info.label}</span>
                                    <span>›</span>
                                </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-txtcolor-700 mb-4">
                                🔎 나의 활동
                            </h3>

                            <div className="divide-y divide-txtcolor-100">
                                {myActivities.map((info) => (
                                <div
                                    key={info.label}
                                    onClick={() => navigate(info.path)}
                                    className="flex items-center justify-between text-txtcolor-700
                                              py-4 cursor-pointer hover:text-brand-700 transition"
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
                <div className="flex flex-col w-full gap-4 order-1 md:order-2">
                    <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-5">
                        {/* 타이틀 */}
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="flex items-center">
                            <span className="w-1 h-[40px] bg-brand-500 rounded-full mr-2" />
                            <div className="flex flex-col">
                              <h1 className="text-[20px] font-bold text-txtcolor-700 flex items-center gap-2">
                                <img src='/lockimg.png' alt='비밀번호 변경' className='w-[20px] h-[20px]'/>
                                계정 보호를 위해 비밀번호를 변경해주세요
                              </h1>
                              <p className="px-[2px] text-[12px] text-txtcolor-300">
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
                                        <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
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
                                            className={`w-full px-3 py-3 ${
                                              isPassword ? "pr-11" : ""
                                            } "w-full bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                                              text-txtcolor-700 text-[14px]
                                              focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"`}
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

                    <div className="flex justify-end gap-3 pt-4 mt-2 mb-1 border-t order-txtcolor-100/60">
                        <button onClick={handleSubmit} disabled={submitting}
                        className="px-4 py-2 w-[140px] 
                                  rounded-xl bg-brand-300 text-txtcolor-700 text-[14px] font-bold
                                  shadow-sm hover:bg-brand-400 transition"
                        >
                        {submitting ? "변경 중..." : "비밀번호 변경"}
                        </button>

                        <button onClick={handleGoDetail}
                        className="px-4 py-2 w-[140px]
                                  rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                                  shadow-sm hover:bg-txtcolor-200/60 transition"
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
