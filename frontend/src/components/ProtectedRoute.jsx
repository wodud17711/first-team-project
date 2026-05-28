import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * 로그인 필요한 라우트 가드.
 *
 * 두 가지 사용 패턴 모두 지원:
 *
 *  1) 단일 라우트 wrap
 *     <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
 *
 *  2) Outlet (여러 라우트 묶어서 보호)
 *     <Route element={<ProtectedRoute />}>
 *       <Route path="/profile"     element={<Profile />} />
 *       <Route path="/dog-profile" element={<DogProfile />} />
 *     </Route>
 *
 * 미인증 시 /login 으로 리다이렉트하고, 원래 가려던 경로를
 * location.state.from 에 담아 보낸다 — 로그인 성공 후 거기로 돌려보낼 때 사용:
 *
 *   // Login.jsx
 *   const location = useLocation()
 *   const redirectTo = location.state?.from ?? '/'
 *   useLogin({ redirectTo })
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children ?? <Outlet />
}
