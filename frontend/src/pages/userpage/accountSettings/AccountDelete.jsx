


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useState } from "react"

import { deleteMe } from "../../../api/users"


function AccountDelete() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    const [selectedReason, setSelectedReason] = useState("")

    const [password, setPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    // 회원 탈퇴 사유
    const reasons = [
      "산책 기록 기능을 잘 사용하지 않게 되었어요",
      "리포트 기능이 기대와 달랐어요",
      "원하는 반려견 정보를 찾기 어려웠어요",
      "커뮤니티 활동을 하지 않게 되었어요",
      "서비스 이용이 불편했어요",
      "오류가 자주 발생했어요",
      "개인정보가 걱정돼요",
      "기타",
    ]

    // 회원 탈퇴 사유에 대한 솔루션
    const solutions = {
      "산책 기록 기능을 잘 사용하지 않게 되었어요":
        "💡 산책 기록이 쌓일수록 주간·월간 리포트에서 반려견의 산책 패턴을 확인할 수 있어요.",

      "리포트 기능이 기대와 달랐어요":
        "💡 리포트는 기록된 산책 데이터를 기반으로 생성되며, 데이터가 누적될수록 더욱 정확하고 다양한 분석을 제공해요.",

      "원하는 반려견 정보를 찾기 어려웠어요":
        "💡 커뮤니티에서 반려견 관련 질문을 남기고 다른 보호자들과 정보를 나눌 수 있어요.",

      "커뮤니티 활동을 하지 않게 되었어요":
        "💡 커뮤니티에서는 산책 팁, 반려견 정보, 보호자들의 다양한 경험을 공유할 수 있어요.",

      "서비스 이용이 불편했어요":
        "💡 불편했던 점을 알려주시면 더 나은 서비스를 만드는 데 큰 도움이 됩니다.",

      "오류가 자주 발생했어요":
        "💡 이용 중 불편을 드려 죄송합니다. 발견하신 오류는 문의를 통해 제보해주시면 빠르게 확인·개선하겠습니다",

      "개인정보가 걱정돼요":
        "💡 개인정보는 관련 법령에 따라 안전하게 보호 및 처리되고 있습니다.",
      
      "기타":
        "💡 남겨주신 소중한 의견은 서비스 개선에 큰 도움이 됩니다.",
    }


    const handleDelete = async () => {
      if (!password.trim()) {
        setError("현재 비밀번호를 입력해주세요.")
        return
      }

      const ok = window.confirm(
        "정말 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
      )

      if (!ok) return

      try {
        setSubmitting(true)
        setError("")

        await deleteMe(password)

        alert("회원 탈퇴가 완료되었습니다.")
        navigate("/")
      } catch (err) {
        console.error(err)
        setError("회원 탈퇴에 실패했습니다. 비밀번호를 확인해주세요.")
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
            회원 탈퇴
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              탈퇴 시 계정 정보가 삭제되니 신중하게 진행해주세요.
            </p>
          </div>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>


      <div className="flex flex-col items-center space-y-6">        
          <div className="flex items-stretch gap-6 w-full">
              {/* 회원탈퇴 경고문구(오른쪽) */}
              <div className="relative shrink-0 w-[350px] flex flex-col gap-3">
                <div className="p-[10px]">
                  <h3 className="text-[20px] font-bold text-red-600 mb-4">
                  ⚠️ 회원 탈퇴
                  </h3>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <ul className="text-[14px] text-gray-700 space-y-2">
                      <li>• 탈퇴 후 계정 복구가 불가능합니다.</li>
                      <li>• 작성한 게시글과 댓글은 삭제됩니다.</li>
                      <li>• 산책 기록과 리포트를 다시 확인할 수 없습니다.</li>
                      <li>(📊 현재까지 기록된 산책 수: n회)</li>
                      <li>• 개인정보는 관련 법령에 따라 처리됩니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 탈퇴진행(오른쪽) */}
              <div className="bg-white rounded-xl border shadow-sm w-full px-6 py-5">
                <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
                    <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
                    👤 기본 정보
                </h3>
                <div className="mb-6">
                  <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                    탈퇴 사유
                  </label>

                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-3 py-4 rounded-xl
                              border border-gray-100 text-[16px]
                              bg-[#f7f7f7] cursor-pointer
                              focus:outline-none focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                  >
                    <option value="">탈퇴 사유를 선택해주세요</option>

                    {reasons.map((reason) => (
                      <option key={reason} value={reason} className="cursor-pointer">
                        {reason}
                      </option>
                    ))}
                  </select>

                  {/* 기타 클릭 시, 사유 입력 가능하게 */}
                  {selectedReason === "기타" && (
                  <div className="mt-4">
                    <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                      상세 사유
                    </label>

                    <textarea
                      rows={4}
                      placeholder="의견을 자유롭게 작성해주세요."
                      className="w-full px-3 py-3 bg-[#f7f7f7] rounded-xl border border-gray-200
                                focus:outline-brand-300 resize-none"
                    />
                  </div>
                  )}

                  {/* 탈퇴 사유 선택 시, 항목에 맞는 솔루션 제공 */}
                  {selectedReason && solutions[selectedReason] && (
                  <div className="mt-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-[14px] text-blue-900">
                      {solutions[selectedReason]}
                    </p>
                  </div>
                  )}
                </div>
                
              
                <div className="mb-4">
                  <label className="block mb-1 text-[14px] font-semibold">
                    현재 비밀번호
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl 
                    border border-gray-100 text-[16px]
                    focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                {error && (
                <p className="mt-6 text-[12px] text-danger">
                    {error}
                </p>
                )}                              

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="px-4 py-2 w-[120px] bg-red-500 text-white rounded-xl"
                  >
                    {submitting ? "처리중..." : "회원 탈퇴"}
                  </button>

                  <button
                    onClick={() => navigate("/mypage")}
                    className="px-4 py-2 w-[120px] bg-gray-200 rounded-xl"
                  >
                    취소
                  </button>
                </div>

              </div>
          </div>
      </div>
    </div>


  )
}

export default AccountDelete
