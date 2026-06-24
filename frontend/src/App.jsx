import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Home from './pages/Home'
import WalkScoreDetail from './pages/WalkScoreDetail'
import WalkRecord from './pages/WalkRecord'
import Statistics from './pages/Statistics'

import Community from './pages/community/Community'
import CommunityWrite from './pages/community/CommunityWrite'
import CommunityEdit from './pages/community/CommunityEdit'
import CommunityDetail from './pages/community/CommunityDetail'

import Login from './pages/Login'
import Join from './pages/Join'
import DogProfile from './pages/DogProfile'

import MyPage from './pages/userpage/MyPage'
import AccountEdit from './pages/userpage/accountSettings/AccountEdit'
import ChangePassword from './pages/userpage/accountSettings/ChangePassword'
import AccountDelete from './pages/userpage/accountSettings/AccountDelete'
import MypagePosts from './pages/userpage/myActivities/MypagePosts'
import MypageComments from './pages/userpage/myActivities/MypageComments'
import MypageLikes from './pages/userpage/myActivities/MypageLikes'
import Notifications from './pages/userpage/Notifications'

import DogListPage from './pages/dogs/DogListPage'
import DogDetailPage from './pages/dogs/DogDetailPage'
import DogCreatePage from './pages/dogs/DogCreatePage'
import DogEditPage from './pages/dogs/DogEditPage'

import NotFound from './pages/NotFound'

// [개발 전용] 최적시간 차트 미리보기 (mock). 실화면 배치 후 제거 가능.
import OptimalTimePreview from './pages/dev/OptimalTimePreview'





function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 공개 라우트 — 비로그인도 접근 가능 (Layout 헤더 없는 풀스크린) */}
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/dog-profile" element={<DogProfile />} />

          {/* [개발 전용] 최적시간 차트 미리보기 (mock, 로그인 불필요) */}
          <Route path="/dev/optimal-time" element={<OptimalTimePreview />} />

          {/* [개발 전용] 커뮤니티 게시판 미리보기 (mock, 로그인 불필요) */}
          <Route path="/dev/community" element={<Community />} />
          <Route path="/dev/community/write" element={<CommunityWrite />} />
          <Route path="/dev/community/:postId" element={<CommunityDetail />} />

          {/* 보호 라우트 — 비로그인 시 /login 으로 리다이렉트 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/walkscore-detail" element={<WalkScoreDetail />} />
              <Route path="/walk" element={<WalkRecord />} />
              <Route path="/statistics" element={<Statistics />} />

              {/* 커뮤니티 페이지 */}
              <Route path="/community" element={<Community />} />
              <Route path="/community/:postId/edit" element={<CommunityEdit />} />
              <Route path="/community/write" element={<CommunityWrite />} />
              <Route path="/community/:postId" element={<CommunityDetail />} />

              {/* 마이페이지(유저 정보관리) */}
              <Route path="/mypage" element={<MyPage/>}/>
              <Route path="/account/edit" element={<AccountEdit/>}/>
              <Route path="/change-password" element={<ChangePassword/>}/>
              <Route path="/account/delete" element={<AccountDelete/>}/>
              <Route path="/mypage/posts" element={<MypagePosts/>}/>
              <Route path="/mypage/comments" element={<MypageComments/>}/>
              <Route path="/mypage/likes" element={<MypageLikes/>}/>
              <Route path="/notifications" element={<Notifications/>}/>
              

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
