


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"

function MyPage() {

    const navigate = useNavigate()

    // 정보 함수
      const basicInfo = [
        {
          label: "이메일",
          value: "정보 없음",
        },
        {
          label: "견종🐶",
          value: "정보 없음"
        },
        {
          label: "성별🤍",
          value: "정보 없음",
        },
      ]
    
      const detailInfo = [
        {
          label: "체중🐾",
          value: "정보 없음",
        },
        {
          label: "중성화🩺",
          value: "정보 없음",
        },
      ]
    
      const lifeInfo = [
        {
          label: "활동량🚶",
          value: "정보 없음",
        },
        {
          label: "선호 산책 시간🌳",
          value:"정보 없음",
        },
        {
          label: "건강 특이사항🩹",
          value: "없음",
        },
      ]
    
      // 프로필 상세 내용
      const renderSection = (title, data) => (
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4">
          <h3 className="flex items-center text-[18px] font-semibold text-sky-900 mb-4">
            <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
            {title}
          </h3>
    
          <div className="flex flex-col gap-3">
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
            <div className="flex flex-col w-full">
                <div className="flex-1 bg-white rounded-xl border shadow-sm p-6">

                    <div className="grid grid-cols-2 gap-4">
                        {renderSection("📋 기본 정보", basicInfo)}
                        {renderSection("🔎 상세 정보", detailInfo)}

                        <div className="col-span-2">
                        {renderSection("🏡 생활 정보", lifeInfo)}
                        </div>
                    </div>
                
                </div>
            </div>
        </div>
        </div>
        
        {/* 수정, 삭제 버튼 */}
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
        </div>

    
    </div>


  )
}

export default MyPage
