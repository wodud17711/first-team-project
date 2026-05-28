import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
// 사용 예시 — 로그인 필요한 라우트는 ProtectedRoute 로 감싸기:
//   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
// 또는 그룹 보호:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/profile"     element={<Profile />} />
//     <Route path="/dog-profile" element={<DogProfile />} />
//   </Route>
// import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Home from './pages/Home'
import WalkRecord from './pages/WalkRecord'
import Community from './pages/Community'
import Profile from './pages/Profile'

import Login from './pages/Login'
import Join from './pages/Join'
import DogProfile from './pages/DogProfile'

import NotFound from './pages/NotFound'


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/walk" element={<WalkRecord />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/login" element={<Login />} />
            <Route path="/join" element={<Join />} />
            <Route path="/dog-profile" element={<DogProfile />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
