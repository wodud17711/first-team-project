


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useEffect, useState } from "react"

import { updateMe } from "../../../api/users"
import { uploadImage, validateImageFile } from "../../../api/uploads"

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
        {
            value: "BEGINNER",
            label: "새싹 보호자🌱",
            desc: "(~1년)"
        },
        {
            value: "JUNIOR",
            label: "초보 보호자🦴",
            desc: "(1~3년)"
        },
        {
            value: "SENIOR",
            label: "숙련 보호자🐕",
            desc: "(3~5년)"
        },
        {
            value: "VETERAN",
            label: "베테랑 보호자🏆",
            desc: "(5년+)"
        }
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

     // 프로필 이미지 변경 함수 — 서버 업로드 후 저장 URL 사용(blob 미사용)
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = "" // 같은 파일 재선택 허용

        if (!file) return

        const invalid = validateImageFile(file)
        if (invalid) {
            alert(invalid)
            return
        }

        try {
            const url = await uploadImage(file)
            setPreviewImg(url)
        } catch (err) {
            console.error(err)
            alert(err?.message || "이미지 업로드에 실패했어요.")
        }
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
                guardianLevel: form.guardianLevel,
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
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            회원정보 수정
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              닉네임, 프로필 이미지 등 계정 정보를 변경할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>


      {/* 유저 정보 */}
        <div className="flex flex-col items-center space-y-6">        
            <div className="flex items-stretch gap-6 w-full">
                {/* 유저 프로필 + 계정 설정(왼쪽) */}
                <div className="relative shrink-0 w-[350px] flex flex-col gap-3">
                  <div className="flex flex-col items-center justify-center pt-[10px]
                                  w-[350px] h-[290px]">
                    <img
                        src={previewImg || "/userpanel/humanProfile.png"}
                        alt="프로필"
                        className="w-[180px] h-[180px] mb-3 rounded-full object-cover shadow-md"
                    />

                    <div className="flex items-center justify-center gap-2 w-full">
                      {/* 사진 변경 */}
                      <label className="w-1/3 h-[36px] flex items-center justify-center
                                      rounded-xl bg-brand-500 text-txtcolor-700 text-[14px] font-bold
                                      shadow-sm hover:bg-brand-600/80 transition cursor-pointer">
                        사진 변경
                        <input type="file" hidden onChange={handleImageChange} />
                      </label>

                      {/* 삭제 */}
                      <button
                        type="button"
                        onClick={() => setPreviewImg(null)}
                        className="w-1/3 h-[36px] flex items-center justify-center
                                  rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                                  shadow-sm hover:bg-txtcolor-200/80 transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>

                {/* 기본 정보(오른쪽) */}
                <div className="bg-white w-full rounded-xl border shadow-sm px-6 py-5">
                    <h3 className="flex items-center text-[20px] font-bold text-txtcolor-700 mb-4">
                        <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
                        👤 기본 정보
                    </h3>

                    <div className="flex flex-col gap-4">
                        {/* 이메일 */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                              <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                                이메일
                              </label>
                              <p className="text-[12px] text-gray-400">
                                  (로그인 아이디로 사용되어 변경할 수 없습니다.)
                              </p>
                          </div>
              
                          <div className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl  
                                          text-txtcolor-700 text-[16px] border border-txtcolor-50">
                              {me?.email}
                          </div>
                        </div>

                        {/* 닉네임 */}
                        <div>
                          <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                              닉네임 <span className="text-red-500">*</span>
                          </label>

                          <input
                              name="nickname"
                              value={form.nickname}
                              onChange={handleChange}
                              className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                                        text-txtcolor-700 text-[16px] focus:outline-brand-500 hover:bg-txtcolor-100/40 transition"
                              placeholder="닉네임을 입력하세요"
                          />
                        </div>

                        {/* 보호자 연차 */}
                        <div>
                            <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
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
                                        guardianLevel: level.value,
                                        })
                                    }
                                    className={`flex-1 flex justify-center px-3 py-3 
                                      rounded-xl border text-center border text-[13px] font-semibold ${
                                        form.guardianLevel === level.value
                                        ? "bg-brand-200 border-brand-500 text-txtcolor-700"
                                        : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                                    }`}
                                    >
                                        <div className="text-[13px] font-medium">
                                            {level.label}
                                        </div>

                                        <div className={`text-[11px] ${
                                            form.guardianLevel === level.value
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
        <div className="flex justify-end gap-3 mt-[20px] pt-4 
                        border-t border-txtcolor-100/60">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 w-[90px] 
                      rounded-xl bg-brand-500 text-txtcolor-700 text-[14px] font-bold
                      shadow-sm hover:bg-brand-600/80 transition"
          >
            저장
          </button>
          <button
            onClick={handleGoDetail}
            className="px-4 py-2 w-[90px]
                      rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                      shadow-sm hover:bg-txtcolor-200/80 transition"
          >
            취소
          </button>
        </div>
    </div>
  )
}

export default AccountEdit
