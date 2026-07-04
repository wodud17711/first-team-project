


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"

// 훅 가져오기
import { useMe } from "../../../hooks/useMe"
import { useDogs } from "../../../hooks/useDogs"

import { deleteMe } from "../../../api/users"
import { getWalkStatistics } from "../../../api/walk"

function AccountDelete() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    // 모든 강아지 산책 횟수 도합
    const { dogs } = useDogs()
    const [totalWalkCount, setTotalWalkCount] = useState(0)

    useEffect(() => {
      if (!dogs || dogs.length === 0) return

      let alive = true

      const fetchAll = async () => {
        const results = await Promise.all(
          dogs.map(async (dog) => {
            const res = await getWalkStatistics(dog.dogId, "MONTH")
            return res.totalWalks ?? res.data?.totalWalks ?? 0
          })
        )

        const total = results.reduce((sum, v) => sum + v, 0)

        if (alive) setTotalWalkCount(total)
      }

      fetchAll() 

      return () => {
        alive = false
      }
    }, [dogs])

    const [selectedReason, setSelectedReason] = useState("")
    const [openReason, setOpenReason] = useState(false)

    const reasonRef = useRef(null)

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (reasonRef.current && !reasonRef.current.contains(e.target)) {
          setOpenReason(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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
            회원 탈퇴
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              탈퇴 시 계정 정보가 삭제되니 신중하게 진행해주세요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]"/>


      <div className="flex flex-col items-center space-y-6">
          {/* 모바일(<md)은 왼쪽 열 350px 고정 탓에 오른쪽 폼이 폭 0으로 붕괴 → 세로 스택 (MyPage #191 패턴) */}
          <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
              {/* 회원탈퇴 경고문구(왼쪽) */}
              <div className="relative shrink-0 w-full md:w-[350px] flex flex-col px-[10px]">
                <h3 className="text-[20px] font-bold text-red-500 mb-4">
                ⚠️ 탈퇴 전 꼭 확인해주세요!
                </h3>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <ul className="text-[14px] text-txtcolor-500 space-y-[18px]">
                    <li>• 탈퇴 후 계정 복구가 불가능합니다.</li>
                    <li>• 작성한 게시글과 댓글은 삭제됩니다.</li>
                    <div>
                      <li>• 산책 기록과 리포트를 다시 확인할 수 없습니다.</li>
                      <li>[📊 현재까지 기록된 반려견과의 산책 수: {totalWalkCount}회]</li>
                    </div>
                    <li>• 재가입하더라도 이전 기록은 복구되지 않습니다.</li>
                    <li>• 개인정보는 관련 법령에 따라 처리됩니다.</li>
                  </ul>
                </div>
              </div>

              {/* 탈퇴진행(오른쪽) */}
              <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm w-full px-6 py-5">
                <h3 className="flex items-center text-[20px] font-bold text-txtcolor-700 mb-4">
                    <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
                    📄 탈퇴 정보 입력
                </h3>
                <div className="mb-6">
                  <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                    탈퇴 사유
                  </label>

                  <div className="relative" ref={reasonRef}>
                    {/* 트리거 버튼 */}
                    <button
                      type="button"
                      onClick={() => setOpenReason((prev) => !prev)}
                      className={`w-full px-3 py-3 rounded-xl border text-left
                        bg-txtcolor-50/50 border-txtcolor-50 text-[14px]
                        hover:bg-txtcolor-100/40 transition
                        ${selectedReason ? "text-txtcolor-700" : "text-txtcolor-300"}
                        ${openReason ? "outline outline-2 outline-brand-300" : ""}
                      `}
                    >
                      {selectedReason || "탈퇴 사유를 선택해주세요"}
                    </button>
                    {openReason && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-txtcolor-100/50 rounded-xl shadow z-10 p-2">
                        <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                          {reasons.map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                setSelectedReason(reason)
                                setOpenReason(false)
                              }}
                              className={`px-3 py-2 rounded-lg text-left text-[14px]
                                hover:bg-brand-100/50 transition
                                ${
                                  selectedReason === reason
                                    ? "bg-brand-200/70 text-txtcolor-700 font-semibold"
                                    : "text-txtcolor-600"
                                }
                              `}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 기타 클릭 시, 사유 입력 가능하게 */}
                  {selectedReason === "기타" && (
                  <div className="mt-4">
                    <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                      상세 사유
                    </label>

                    <textarea
                      rows={4}
                      placeholder="의견을 자유롭게 작성해주세요."
                      className="w-full p-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                                text-txtcolor-700 text-[14px]
                                focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                    />
                  </div>
                  )}

                  {/* 탈퇴 사유 선택 시, 항목에 맞는 솔루션 제공 */}
                  {selectedReason && solutions[selectedReason] && (
                  <div className="mt-2 mb-6 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                    <p className="text-[14px] text-sky-700">
                      {solutions[selectedReason]}
                    </p>
                  </div>
                  )}
                </div>
                
              
                <div className="mb-4">
                  <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
                    현재 비밀번호
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                              text-txtcolor-700 text-[14px]
                              focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                {error && (
                <p className="mt-6 text-[12px] text-danger">
                    {error}
                </p>
                )}                              

                

              </div>
          </div>
      </div>
      {/* 회원탈퇴 및 취소 */}
      <div className="flex justify-end gap-3 mt-[20px] pt-4 
                        border-t border-txtcolor-100/60">
        <button
          onClick={handleDelete}
          disabled={submitting}
          className="px-4 py-2 w-[90px]
                    rounded-xl bg-red-500 text-white text-[14px] font-bold
                    shadow-sm hover:bg-red-600/90 transition">
          {submitting ? "처리중..." : "회원 탈퇴"}
        </button>

        <button
          onClick={() => navigate("/mypage")}
          className="px-4 py-2 w-[90px]
                    rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                    shadow-sm hover:bg-txtcolor-200/60 transition">
          취소
        </button>
      </div>
    </div>
  )
}

export default AccountDelete
