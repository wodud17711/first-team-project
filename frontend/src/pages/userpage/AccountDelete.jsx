


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../hooks/useMe"

function AccountDelete() {

    const navigate = useNavigate()
    const { me, loading } = useMe()


    // 정보 함수
      const basicInfo = [
        {
          label: "이메일",
          value: me?.email || "정보 없음"
        },
        {
          label: "닉네임",
          value: me?.nickname || "정보 없음"
        },
        {
          label: "이름(실명)",
          value: "홍길동",
        },
        {
          label: "생년월일",
          value: "2026.06.10.",
        },
        {
          label: "휴대폰 번호",
          value: "010-0000-0000",
        },
        {
          label: "보호자 연차",
          value: "새싹 보호자🌱",
        },
      ]
    
      const accountSettings = [
        {
          label: "회원정보 수정",
          value: (
            <button
                onClick={() => navigate("")}
                className="px-3 py-1 text-[12px] bg-sky-500 text-white rounded-lg hover:bg-sky-700"
            >
                수정
            </button>
            ),
        },
        {
          label: "비밀번호 변경",
          value: (
            <button
                onClick={() => navigate("")}
                className="px-3 py-1 text-[12px] bg-sky-500 text-white rounded-lg hover:bg-sky-700"
            >
                변경
            </button>
            ),
        },
        {
          label: "회원탈퇴",
          value: (
            <button
                onClick={() => navigate("")}
                className="px-3 py-1 text-[12px] bg-sky-500 text-white rounded-lg hover:bg-sky-700"
            >
                탈퇴
            </button>
            ),
        },
      ]
    
      // 프로필 상세 내용
      const renderSection = (title, data) => (
        <div className="bg-white rounded-xl border shadow-sm px-5 py-4">
          <h3 className="flex items-center text-[20px] font-semibold text-sky-900 mb-4">
            <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
            {title}
          </h3>
    
          <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          {data.map((info) => (
            <div key={info.label} className="flex items-center text-[14px]">
    
              <span className="font-semibold shrink-0 text-gray-700">
                {info.label}
              </span>
    
              <div className="flex-1 mx-3 border-b border-dashed border-gray-400" />
    
              <span className="text-gray-600 shrink-0">
                {info.value}
              </span>
    
            </div>
          ))}
          </div>
        </div>
      )


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


      {/* 유저 정보 상세칸 */}
        <div className="flex flex-col items-center space-y-6">        
            <div className="flex items-stretch gap-6 w-full">
                {/* 유저 이미지 */}
                <div className="relative shrink-0">
                    <img
                    src='/userpanel/humanProfile.png'
                    className="w-[350px] h-[470px] rounded-xl object-cover shadow-md"
                    />
                </div>

                {/* 유저 정보 */}
                <div className="flex flex-col w-full gap-4">
                    {renderSection("👤 기본 정보", basicInfo)}
                    {renderSection("🔐 계정 설정", accountSettings)}
                </div>
            </div>
        </div>
        
        {/* 수정, 삭제 버튼
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
            className="px-4 py-2 w-[90px] bg-sky-500 text-white text-[14px] font-bold rounded-xl hover:bg-sky-600 transition"
            >
            수정
            </button>

            <button
            className="px-4 py-2 w-[90px] bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 transition"
            >
            삭제
            </button>
        </div> */}

    
    </div>


  )
}

export default AccountDelete
