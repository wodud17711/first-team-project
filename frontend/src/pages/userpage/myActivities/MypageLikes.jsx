


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"
import { useMyLikes } from "../../../hooks/useCommunity"

// 컴포넌트 import
import PostCard from "../../../components/PostCard"


function MypageLikes() {

  const navigate = useNavigate()
  const { posts, total, loading, error } = useMyLikes()

  

  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">
            좋아요한 게시글
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500"/>
            <p className="text-[14px] text-txtcolor-500 font-light">
              내가 좋아한 게시글들을 볼 수 있어요.
            </p>
          </div>
        </div>
        {/* 등록수 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm 
                        border border-txtcolor-100/50">
          <p className="text-[12px] font-semibold text-txtcolor-400">좋아요한 게시글</p>
          <p className="text-[20px] font-bold text-brand-700">{total ?? 0}개</p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-txtcolor-400/40 mb-[20px]'/>


      {/* 목록 */}
      {loading ? (
        <div className="p-4 text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="p-4 text-danger">목록을 불러오지 못했습니다.</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <div className="text-[40px]">🐾</div>
          <p className="text-[14px]">아직 좋아요한 게시글이 없어요. 관심 있는 게시글을 저장해보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onClick={() => navigate(`/community/${post.postId}`, {state: {from: "mypageLikes"}})}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default MypageLikes
