import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  {
    label: '🐾 산책 기록',
    to: '/walk',
    children: ['1', '2', '3'],
  },
  {
    label: '💬 커뮤니티',
    to: '/community',
    children: ['1', '2', '3'],
  },
  {
    label: '👤 마이페이지',
    to: '/mypage',
    children: ['1', '2', '3'],
  },
  {
    label: '🐕 반려견 프로필',
    to: '/dog-profile-list',
    children: ['1', '2', '3'],
  },
]

function Layout() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-600 cursor-pointer"  
              onClick={() => navigate('/')}>🐕 산책 라이프</h1>
          <div className="w-[600px]">
            <nav
              className="grid grid-cols-5"
              onMouseEnter={() => setIsMenuOpen(true)}
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-center text-sm font-medium transition-colors ${
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
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="w-[600px] mx-auto py-6">
            <div className="grid grid-cols-5">
              {navItems.map((item) => (
                <div key={item.to}>
                  <div className="flex flex-col gap-2">
                    {item.children.map((sub) => (
                      <div
                        key={sub}
                        className="text-sm text-gray-600 hover:text-brand-600 cursor-pointer"
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
