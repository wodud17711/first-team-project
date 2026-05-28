import { createContext, useContext, useEffect, useState } from 'react'
import { AUTH_CHANGED_EVENT, getAccessToken } from '../api/tokenStorage'
import { logout as apiLogout } from '../api/auth'

/**
 * 전역 인증 상태.
 *
 * 사용 (선택 사항):
 *   // App.jsx 에 한 줄 래핑
 *   <AuthProvider><BrowserRouter>...</BrowserRouter></AuthProvider>
 *
 *   // 컴포넌트에서
 *   const { isAuthenticated, logout, refresh } = useAuth()
 *
 * useLogin / useSignup 은 이 hook 에 의존하지 않으므로 AuthProvider 없어도 동작함.
 * 로그인·로그아웃 후 isAuthenticated 가 자동 갱신되길 원하면 useAuth().refresh() 호출.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken())

  // 토큰 변경 동기화:
  //  - 'storage'      : 다른 탭에서 localStorage 변경
  //  - AUTH_CHANGED_EVENT : 같은 탭에서 setAccessToken/removeAccessToken 호출
  useEffect(() => {
    const onChange = () => setIsAuthenticated(!!getAccessToken())
    window.addEventListener('storage', onChange)
    window.addEventListener(AUTH_CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener(AUTH_CHANGED_EVENT, onChange)
    }
  }, [])

  /** localStorage 의 AT 를 다시 읽어 상태 동기화. login·signup 후 호출. */
  const refresh = () => setIsAuthenticated(!!getAccessToken())

  /** 서버 로그아웃 + 로컬 상태 정리. */
  const logout = async () => {
    await apiLogout()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// AuthProvider 와 한 파일에 두는 게 사용 편의상 더 명확하므로 fast-refresh 룰만 예외.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
