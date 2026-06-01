import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '🏠 홈', end: true },
  { to: '/walk', label: '🐾 산책 기록' },
  { to: '/community', label: '💬 커뮤니티' },
  { to: '/profile', label: '🐕 프로필' },
]

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-600">🐕 산책 라이프</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
