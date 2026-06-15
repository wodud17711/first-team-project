


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

// 훅 가져오기
import { useMe } from "../../hooks/useMe"
import { useMyComments, useMyLikes, useMyPosts } from "../../hooks/useCommunity"

function MyPage() {

    const navigate = useNavigate()
    const { me, loading } = useMe()

    // 활동 정보(활동수)
    const { total: postTotal = 0 } = useMyPosts()
    const { total: commentTotal = 0 } = useMyComments()
    const { total: likeTotal = 0 } = useMyLikes()

    const guardianLevelLabel = {
        BEGINNER: "새싹 보호자🌱",
        JUNIOR: "초보 보호자🦴",
        SENIOR: "숙련 보호자🐕",
        VETERAN: "베테랑 보호자🏆",
    }


    // 정보 함수
    const basicInfo = [
        { label: "가입일", value: me?.createdAt?.split("T")[0] || "정보 없음" },
        { label: "이메일", value: me?.email || "정보 없음" },
        { label: "닉네임", value: me?.nickname || "정보 없음" },
        { label: "보호자 연차", value: guardianLevelLabel[me?.guardianLevel] || "정보 없음" },
    ]

    const postInfo = [
        { label: "작성한 게시글", value: `${postTotal}개` || "정보 없음" },
        { label: "작성한 댓글", value: `${commentTotal}개` || "정보 없음" },
        { label: "좋아요한 게시글", value: `${likeTotal}개` || "정보 없음" },
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

    console.log(me)


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
            마이페이지
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              보호자님의 계정 정보를 확인하고 관리할 수 있어요.
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
                        <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
                        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
                        👤 기본 정보
                        </h3>
                        <div className="flex flex-col gap-4">
                        {basicInfo.map((info) => (
                            <div key={info.label}>
                            <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                                {info.label}
                            </label>

                            <div className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px]">
                                {info.value}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm px-6 py-5">
                        <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
                        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
                        📝 활동 정보
                        </h3>
                        <div className="flex flex-col gap-4">
                        {postInfo.map((info) => (
                            <div key={info.label}>
                            <label className="block mb-1 text-[14px] font-semibold text-gray-700">
                                {info.label}
                            </label>

                            <div className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px]">
                                {info.value}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
  )
}

export default MyPage
