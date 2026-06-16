import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'

const navItems = [
  {
    label: '산책 기록',
    to: '/walk',
    children: [
      { label: '산책 기록 조회', to: '/walk' },
      { label: '산책 통계', to: '/walk' },
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
      // { label: '반려견 프로필 목록', to: '/walk' },
      // { label: '산책 통계', to: '/walk' },
    ],
  },
]

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative bg-white border-b border-gray-200 sticky top-0 z-50"
              onMouseLeave={() => setIsMenuOpen(false)}>
        <div className="max-w-6xl mx-auto px-3 py-3 grid grid-cols-[1fr_600px_40px] gap-4 items-center">
          <Link to="/" className="text-lg font-bold text-brand-600">
            <img
                src="/navigationbar/SiteLogo.png"
                alt="사이트 로고"
                className="w-[70px] h-full block shrink-0 hover:scale-105 transition"
              />
          </Link>
          <div className="w-[600px]"
               onMouseEnter={() => setIsMenuOpen(true)}>
            <nav className="grid grid-cols-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `py-2 rounded-md text-center text-[16px] font-semibold transition-colors" ${
                      isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 네비게이션바에 마우스 가져다 댔을 때 메뉴판 내려오는 거 */}
          <div
            className={`
              absolute top-full left-0 w-full
              bg-white/60 backdrop-blur
              shadow-lg border-t border-gray-200 z-50
              overflow-hidden
              transition-all duration-300 ease-in-out

              ${
                isMenuOpen
                  ? 'max-h-80 opacity-100 translate-y-0'
                  : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
              }
            `}
          >
            <div className="max-w-6xl mx-auto px-3 grid grid-cols-[1fr_600px_40px] gap-4">
              <div></div>
              <div className="w-[600px] py-6 ml-auto">
                <div className="grid grid-cols-3">
                  {navItems.map((item) => (
                    <div
                      key={item.to}
                      className="flex flex-col items-center gap-2"
                    >
                      {item.children.map((sub) => (
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
          <div className="flex items-center gap-4 h-full">
            {/* 마이페이지 */}
            <Link
              to="/mypage"
              className="relative group flex items-center justify-center h-10"
            >
              <img
                src="/navigationbar/mypage.png"
                alt="마이페이지"
                className="w-[20px] h-[20px] block shrink-0 hover:scale-105 transition"
              />

              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                마이페이지
              </span>
            </Link>

            {/* 알림 */}
            <Link
              to="/"
              className="relative group flex items-center justify-center h-10"
            >
              <img
                src="/navigationbar/notice.png"
                alt="알림"
                className="w-[21px] h-[21px] block shrink-0 hover:scale-105 transition"
              />

              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
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
