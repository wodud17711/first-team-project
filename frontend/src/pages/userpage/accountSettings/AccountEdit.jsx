


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useEffect, useState } from "react"

import { updateMe } from "../../../api/users"

function AccountEdit() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    // 프로필 이미지
    const [previewImg, setPreviewImg] = useState("")

    // 수정용 state
    const [form, setForm] = useState({
        nickname: "",
        guardianLevel: "",
    })

    const guardianLevels = [
        { label: "새싹 보호자🌱", desc: "(~ 1년)" },
        { label: "노련한 보호자🐕", desc: "(1 ~ 5년)" },
        { label: "베테랑 보호자🏆", desc: "(5년+)" },
    ]

    // 이미지
    useEffect(() => {
        if (me?.profileImageUrl) {
            setPreviewImg(me.profileImageUrl)
        }
    }, [me])

    // 기본 정보
    useEffect(() => {
        if (me) {
            setForm({
                nickname: me.nickname || "",
                guardianLevel: me.guardianLevel || "",
            })
        }
    }, [me])

     // 프로필 이미지 변경 함수
    const handleImageChange = (e) => {
        const file = e.target.files?.[0]

        if (!file) return

        setPreviewImg(URL.createObjectURL(file))
    }

    // input 변경 함수
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm({
        ...form,
        [name]: value
        })
    }

    // 확인 클릭 시, 알림창 + 페이지 이동
      const handleSubmit = async () => {
        if (!form.nickname.trim()) {
            alert("닉네임을 입력해주세요.")
            return
        }

        const confirmEdit = window.confirm(
            "수정을 완료하시겠습니까?"
        )

        if (!confirmEdit) return

        try {
            await updateMe({
                nickname: form.nickname,
                profileImageUrl: previewImg,
            })

            alert("수정되었습니다.")
            navigate("/mypage")

        } catch (err) {
            console.error(err)
            alert("수정 실패")
        }
    }
    
      // 취소 클릭 시, 경고창 + 페이지 이동
      const handleGoDetail = () => {
        const confirmMove = window.confirm(
          "변경사항이 저장되지 않을 수 있습니다!\n취소하시겠습니까?"
        )
    
        if (confirmMove) {
          navigate(`/mypage`)
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
            회원정보 수정
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              닉네임, 프로필 이미지 등 계정 정보를 변경할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>


      {/* 유저 정보 */}
        <div className="flex flex-col items-center space-y-6">        
            <div className="flex items-stretch gap-6 w-full">
                {/* 유저 프로필 + 계정 설정(왼쪽) */}
                <div className="relative shrink-0 w-[350px] flex flex-col gap-3">
                    <div className="flex flex-col items-center justify-center p-[10px]">
                        <img
                            src={previewImg || "/userpanel/humanProfile.png"}
                            alt="프로필"
                            className="w-[130px] h-[130px] mb-2 rounded-full object-cover shadow-md"
                        />

                        {/* 변경, 삭제 버튼 */}
                        <div className="flex gap-2">
                            <label className="px-3 py-1 text-[12px] font-medium bg-white/80 backdrop-blur rounded-full cursor-pointer">
                            📷 변경
                            <input type="file" hidden onChange={handleImageChange} />
                            </label>

                            <button
                            type="button"
                            onClick={() => setPreviewImg(null)}
                            className="px-3 py-1 text-[12px] font-medium bg-white/80 backdrop-blur rounded-full text-red-500"
                            >
                            🗑️ 삭제
                            </button>
                        </div>
                        
                    </div>
                </div>

                {/* 기본 정보(오른쪽) */}
                <div className="bg-white w-full rounded-xl border shadow-sm px-6 py-5">
                    <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
                        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
                        👤 기본 정보
                    </h3>

                    <div className="flex flex-col gap-4">

                        {/* 이메일 */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block text-[14px] font-semibold text-gray-700">
                                이메일
                                </label>
                                <p className="text-[12px] text-gray-400">
                                    (로그인 아이디로 사용되어 변경할 수 없습니다.)
                                </p>
                            </div>
                
                            <div className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px]">
                                {me?.email}
                            </div>
                        </div>

                        {/* 닉네임 */}
                        <div>
                            <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                                닉네임 <span className="text-red-500">*</span>
                            </label>

                            <input
                                name="nickname"
                                value={form.nickname}
                                onChange={handleChange}
                                className="w-full px-3 py-4 pr-12 bg-[#f7f7f7] rounded-xl text-[16px] border border-gray-100
                                                    focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                                placeholder="닉네임을 입력하세요"
                            />
                        </div>

                        {/* 보호자 연차 */}
                        <div>
                            <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                                보호자 연차 <span className="text-red-500">*</span>
                            </label>

                            <div className="flex gap-2">
                                {guardianLevels.map((level) => (
                                    <button
                                    key={level.label}
                                    type="button"
                                    onClick={() =>
                                        setForm({
                                        ...form,
                                        guardianLevel: level.label,
                                        })
                                    }
                                    className={`flex-1 flex  justify-center px-3 py-4 rounded-xl border text-center ${
                                        form.guardianLevel === level.label
                                        ? "bg-brand-200 border-brand-500"
                                        : "bg-white border-gray-200 text-gray-400 hover:bg-[#F0F0F0] transition"
                                    }`}
                                    >
                                        <div className="text-[13px] font-medium">
                                            {level.label}
                                        </div>

                                        <div className={`text-[11px] ${
                                            form.guardianLevel === level.label
                                            ? "text-brand-600 text-gray-500"
                                            : "text-gray-400/80"
                                        }`}
                                        >
                                            {level.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 저장, 취소 버튼 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
            onClick={handleSubmit}
            className="px-4 py-2 w-[90px] bg-sky-500 text-white rounded-xl"
            >
            저장
            </button>
            <button
            onClick={handleGoDetail}
            className="px-3 py-2 w-[90px] bg-danger text-white text-[14px] font-bold rounded-xl"
            >
            취소
            </button>
        </div>

    </div>


  )
}

export default AccountEdit
