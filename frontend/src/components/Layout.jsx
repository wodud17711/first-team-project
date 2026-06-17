import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation, } from 'react-router-dom'

import { useNotifications } from '../hooks/usenotifications'

const navItems = [
  {
    label: '오늘의 산책지수',
    to: '/mypage', 
    // 아직 오늘의 산책지수 링크가 없어서 그냥 임시로 걸어둔 링크
  },
  {
    label: '산책 기록',
    to: '/walk',
    children: [
      { label: '주간/월간 리포트', to: '/walk' },
      { label: '산책 캘린더', to: '/walk' },
    ],
  },
  {
    label: '커뮤니티',
    to: '/community',
    children: [
      { label: '사료·간식', to: '/community?category=1' },
      { label: '병원·영양제', to: '/community?category=2' },
      { label: '산책로 추천', to: '/community?category=3' },
      { label: '반려견 자랑', to: '/community?category=4' },
      { label: '산책 메이트 찾기', to: '/community?category=5' },
    ],
  },
  {
    label: '반려견 프로필',
    to: '/dog-profile-list',
    children: [
      { label: '반려견 프로필 등록', to: '/dog-profile-create' },
    ],
  },
]

function Layout() {
  // 드롭다운
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 알람 표시
  const { unreadCount, refetch } = useNotifications()

  const location = useLocation()

  useEffect(() => {
  const handler = () => {
      refetch()
    }

    window.addEventListener("notifications-updated", handler)

    return () => {
      window.removeEventListener("notifications-updated", handler)
    }
  }, [refetch])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 py-3 grid grid-cols-[70px_1fr_65px] gap-[200px]">
          <Link to="/" className="inline-flex items-center w-fit">
            <img
                src="/navigationbar/SiteLogo.png"
                alt="사이트 로고"
                className="w-[70px] h-auto block hover:scale-105 transition"
              />
          </Link>

          <div className="flex-1 flex justify-center"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}>
            <nav className="grid grid-cols-4 w-[600px] mx-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex justify-center py-[10px] text-[16px] font-semibold transition-colors
                    ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`
                  }
                >
                  {({ isActive }) => (
                    <span className="relative inline-block px-4">
                      {item.label}

                      {/* underline */}
                      <span
                        className={`
                          absolute left-0 -bottom-[22px] w-full h-[4px]
                          bg-brand-500 rounded-full
                          transition-transform duration-200 origin-center
                          ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}
                        `}
                      />
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 드롭다운 */}
          <div
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
            className={`
              absolute top-full left-0 w-full
              bg-white/60 backdrop-blur
              shadow-lg border-t border-gray-200 z-50
              overflow-hidden transition-all duration-300 ease-in-out

              ${isMenuOpen
                ? 'max-h-80 opacity-100'
                : 'max-h-0 opacity-0 pointer-events-none'}
            `}
          >
            <div className="max-w-6xl mx-auto px-3 grid grid-cols-[70px_1fr_65px] gap-[200px]">
              <div></div>
              <div className="w-[600px] py-6 mx-auto">
                <div className="grid grid-cols-4">
                  {navItems.map((item) => (
                    <div
                      key={item.to}
                      className="flex flex-col items-center gap-2"
                    >
                      {item.children?.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.to}
                          className="text-sm text-gray-500 hover:text-brand-600"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 마이페이지, 알림 아이콘 */}
          <div className="flex items-center gap-6 h-full">
            {/* 마이페이지 */}
            <Link
              to="/mypage"
              className="relative group flex items-center justify-center h-10"
            >
              <img
                src="/navigationbar/mypage.png"
                alt="마이페이지"
                className="w-[20px] h-[20px] block shrink-0 transition opacity-60 hover:opacity-100"
              />

              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[12px] text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                마이페이지
              </span>
            </Link>

            {/* 알림 */}
            <Link
              to="/notifications"
              className="relative group flex items-center justify-center h-10"
            >
              <img
                src="/navigationbar/notice.png"
                alt="알림"
                className="w-[21px] h-[21px] block shrink-0 transition opacity-60 hover:opacity-100"
              />
              {unreadCount > 0 && (
              <span
                className="
                  absolute top-[6px] right-[-2px]
                  w-2.5 h-2.5
                  rounded-full bg-red-500
                  border border-white
                "
              />
            )}
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[12px] text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                알림
              </span>
            </Link>
          </div>
        </div>

        
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
          © 2026 반려견 산책 라이프 플랫폼
        </div>
      </footer>
    </div>
  )
}

export default Layout
