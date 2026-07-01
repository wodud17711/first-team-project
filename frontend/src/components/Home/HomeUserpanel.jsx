import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

// hooks (실 API 연결)
import { useMe } from '../../hooks/useMe'
import { useDogs } from '../../hooks/useDogs'
import { useAuth } from '../../hooks/useAuth'
import { useWalkScore } from '../../hooks/useWalkScore'


import { onImgError, HUMAN_FALLBACK } from '../../utils/imageFallback'


function HomeUserpanel() {

  const navigate = useNavigate()
  const { me } = useMe()
  const { dogs } = useDogs()
  const { logout } = useAuth()

  // 유저패널에 대표 강아지만 보이게
  const mainDog = dogs.find(dog => dog.isMain);

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="w-full max-w-[320px] md:w-[300px] shrink-0">
      <div className="flex flex-col bg-white rounded-xl border border-txtcolor-100/50 shadow-sm p-4 overflow-hidden">
        <div className="mb-3">
          <p className="text-[14px] uppercase tracking-wider font-thin">MY PROFILE</p>
          <p className="text-[20px] font-bold">오늘도 즐거운 산책 되세요</p>
        </div>
        <div className='flex items-center justify-center gap-3'>
          {/* 유저 */}
          <div className="flex-1 flex flex-col p-3 gap-2 border rounded-lg">
            <p className="mb-[5px] text-[14px] font-bold text-center">보호자</p>
              <div className='h-[70px] flex justify-center flex flex-col items-center justify-center'>
              <img src={me?.profileImageUrl || "/userpanel/humanProfile.png"} alt='프로필사진'
                  onError={onImgError(HUMAN_FALLBACK)}
                  className='w-[60px] h-[60px] rounded-[43%] object-cover object-center'/>
              <p className="mt-[5px] text-[14px] font-bold">{me?.nickname ?? '게스트'}</p>
              </div>
          </div>

          {/* 대표 강아지 */}
          <div className="flex-1 flex flex-col p-3 gap-2 border rounded-lg">
            <p className="mb-1 text-[14px] font-bold text-center">대표 강아지</p>

            <div className='h-[70px] flex justify-center'>
                {!mainDog ? (
                <p className="text-[13px] text-gray-500 py-4 text-center">
                    아직 등록된
                    <br />
                    반려견이 없어요
                </p>
                    ) : (
                    <div key={mainDog.dogId} className="flex items-center gap-3">    
                      <div className='flex flex-col items-center justify-center'>
                      {mainDog.profileImageUrl ? (
                        <img
                        src={mainDog.profileImageUrl}
                        onError={onImgError()}
                        className="w-[60px] h-[60px] shadow rounded-[43%] object-cover object-center"
                        alt={mainDog.name}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-[60px] h-[60px]
                                        bg-white shadow rounded-[43%] object-cover object-center">
                          <div className="text-[30px]">🐶</div>
                        </div>
                      )}
                      <p className="mt-[5px] text-[14px] font-bold">{mainDog.name}</p>
                  </div>
                </div>
                )}
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="mt-auto pt-3">
          <button onClick={handleLogout}
                  className="flex justify-center items-center w-full gap-4 font-medium
                              rounded-lg p-2 bg-brand-300/80 cursor-pointer"
          >
            <div className='flex items-center gap-2'>
              <img src='/userpanel/logout.png' alt='로그아웃' className='w-[17px] h-[17px]'/>
              <p className="text-[14px]">로그아웃</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomeUserpanel
