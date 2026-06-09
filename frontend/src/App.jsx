import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Home from './pages/Home'
import WalkRecord from './pages/WalkRecord'
import Community from './pages/Community'
import Profile from './pages/Profile'

import Login from './pages/Login'
import Join from './pages/Join'
import DogProfile from './pages/DogProfile'

import DogListPage from './pages/dogs/DogListPage'
import DogDetailPage from './pages/dogs/DogDetailPage'
import DogCreatePage from './pages/dogs/DogCreatePage'
import DogEditPage from './pages/dogs/DogEditPage'

import NotFound from './pages/NotFound'




function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 공개 라우트 — 비로그인도 접근 가능 (Layout 헤더 없는 풀스크린) */}
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/dog-profile" element={<DogProfile />} />

          {/* 보호 라우트 — 비로그인 시 /login 으로 리다이렉트 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/walk" element={<WalkRecord />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              

              {/* 반려견 프로필 페이지 */}
              <Route path="/dog-profile-list" element={<DogListPage/>}/>
              <Route path="/dog-profile-detail/:dogId" element={<DogDetailPage/>}/>
              <Route path="/dog-profile-create" element={<DogCreatePage/>}/>
              <Route path="/dog-profile-edit/:dogId" element={<DogEditPage/>}/>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
