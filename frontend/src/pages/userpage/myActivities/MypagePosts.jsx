


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"
import { useMyPosts } from "../../../hooks/useCommunity"

// 컴포넌트 import
import PostCard from "../../../components/PostCard"


function MypagePosts() {

  const navigate = useNavigate()
  const { posts, total, loading, error } = useMyPosts()

  

  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            내가 작성한 게시글
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              커뮤니티에 게시한 나의 글들을 볼 수 있어요.
            </p>
          </div>
        </div>
        {/* 이동버튼 */}
        <div className="text-center rounded-xl shadow-sm border">
          <button
            onClick={() => navigate("/mypage")}
            className="
              px-4 py-2 rounded-xl
              border border-sky-700
              text-sky-700 font-semibold
              hover:bg-sky-700 hover:text-white
              transition
            "
          >
            ← 마이페이지로
          </button>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>

      {/* 목록 */}
      {loading ? (
        <div className="p-4 text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="p-4 text-danger">목록을 불러오지 못했습니다.</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <div className="text-[40px]">🐾</div>
          <p className="text-[14px]">아직 글이 없어요. 첫 글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onClick={() => navigate(`/community/${post.postId}`, {state: {from: "mypagePosts"}})}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default MypagePosts
