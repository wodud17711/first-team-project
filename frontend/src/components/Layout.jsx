import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, Link, useLocation, } from 'react-router-dom'

import { useNotifications } from '../hooks/usenotifications'

const navItems = [
  {
    label: '오늘의 산책지수',
    to: '/walkscore-detail',
  },
  {
    label: '산책 기록',
    to: '/walk',
    children: [
      { label: '산책 캘린더', to: '/walk/calendar' },
      { label: '주간/월간 리포트', to: '/walk/report' },
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
      { label: '견종백과', to: '/breeds' },
    ],
  },
]

function Layout() {
  // 데스크톱(lg+) 호버 드롭다운
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // 모바일/패드(lg 미만) 햄버거 드로어
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // 호버 인텐트: 트리거(nav)와 드롭다운 사이 헤더 패딩(데드존)을 천천히 지나도
  // 즉시 닫히지 않게 닫기를 잠깐 지연. 그 사이 드롭다운 진입 시 취소된다.
  const closeTimer = useRef(null)
  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setIsMenuOpen(true)
  }
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setIsMenuOpen(false), 150)
  }
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  // 알람 표시
  const { unreadCount, refetch } = useNotifications()

  const location = useLocation()

  // 라우트 이동 시 모바일 드로어 닫기
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname, location.search])

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
      <header className="relative bg-white border-b border-txtcolor-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* 로고 */}
          <Link to="/" className="inline-flex items-center w-fit shrink-0">
            <img
                src="/navigationbar/SiteLogo.png"
                alt="사이트 로고"
                className="w-[60px] sm:w-[70px] h-auto block transition"
              />
          </Link>

          {/* 데스크톱(lg+) 중앙 네비 */}
          <div className="hidden lg:flex flex-1 justify-center"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}>
            <nav className="grid grid-cols-4 w-[600px] mx-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group relative flex justify-center py-[10px] text-[16px] font-semibold transition-colors
                    ${isActive ? 'text-txtcolor-700' : 'text-txtcolor-400 hover:text-txtcolor-700'}`
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

          {/* 데스크톱(lg+) 호버 드롭다운 */}
          <div
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
            className={`
              hidden lg:block
              absolute top-full left-0 w-full
              bg-white/60 backdrop-blur
              shadow-lg border-t border-gray-200 z-50
              overflow-hidden transition-all duration-300 ease-in-out

              ${isMenuOpen
                ? 'max-h-80 opacity-100'
                : 'max-h-0 opacity-0 pointer-events-none'}
            `}
          >
            <div className="max-w-6xl mx-auto px-3 flex">
              <div className="flex-1 flex justify-center">
                <div className="w-[600px] py-6">
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
                            className="text-[14px] text-txtcolor-300 hover:text-brand-700"
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
          </div>

          {/* 우측: 마이페이지 / 알림 / (모바일·패드) 햄버거 */}
          <div className="flex items-center gap-4 sm:gap-6 h-full shrink-0">
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

              <span className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1
                               text-[12px] text-white bg-txtcolor-700 rounded whitespace-nowrap opacity-0
                               group-hover:opacity-100 transition pointer-events-none z-50">
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
              <span className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1
                               text-[12px] text-white bg-txtcolor-700 rounded whitespace-nowrap opacity-0
                               group-hover:opacity-100 transition pointer-events-none z-50">
                알림
              </span>
            </Link>

            {/* 햄버거 (lg 미만) */}
            <button
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((v) => !v)}
              className="lg:hidden flex items-center justify-center h-10 w-8 text-txtcolor-500 hover:text-txtcolor-700"
            >
              {isMobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일·패드(lg 미만) 드로어 */}
        <div
          className={`
            lg:hidden overflow-hidden bg-white border-t border-gray-100
            transition-all duration-300 ease-in-out
            ${isMobileOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 pointer-events-none'}
          `}
        >
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
            {navItems.map((item) => (
              <div key={item.to} className="py-1 border-b border-gray-50 last:border-b-0">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block py-2.5 text-[16px] font-semibold ${isActive ? 'text-brand-700' : 'text-txtcolor-600'}`
                  }
                >
                  {item.label}
                </NavLink>
                {item.children && (
                  <div className="flex flex-col pl-3 pb-2">
                    {item.children.map((sub) => (
                      <Link
                        key={sub.label}
                        to={sub.to}
                        className="py-1.5 text-[14px] text-txtcolor-400 hover:text-brand-700"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-6">
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
