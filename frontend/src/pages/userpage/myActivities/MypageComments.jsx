


// - 사이즈: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48

import { useNavigate } from "react-router-dom"
import { useMyComments } from "../../../hooks/useCommunity"

// 컴포넌트 import
import PostCard from "../../../components/PostCard"
import CommentCard from "../../../components/CommentCard"


function MypageComments() {

  const navigate = useNavigate()
  const { comments, total, loading, error } = useMyComments()

  // 댓글 그룹화(같은 게시글에 쓴 댓글 모아보기)
  const groupedComments = Object.values(
    comments.reduce((acc, comment) => {
      if (!acc[comment.postId]) {
        acc[comment.postId] = {
          postId: comment.postId,
          postTitle: comment.postTitle,
          comments: [],
        }
      }

      acc[comment.postId].comments.push(comment)

      return acc
    }, {})
  ).sort(
    (a, b) =>
      new Date(b.comments[0].createdAt) -
      new Date(a.comments[0].createdAt)
  )


  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="flex justify-between items-start mb-4">
        {/* 제목 */}
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">
            내가 작성한 댓글
          </h1>

          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700"/>
            <p className="text-[14px] text-gray-500 font-light">
              내가 남긴 댓글을 최신 활동 순으로 확인할 수 있어요.
            </p>
          </div>
        </div>

        {/* 우측 통계 카드 */}
        <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border min-w-[120px]">
          <p className="text-[12px] text-gray-500">작성한 댓글</p>
          <p className="text-[20px] font-bold text-sky-700">
            {total ?? 0}개
          </p>
        </div>
      </div>
      <div className='w-full h-[1px] bg-sky-700/50 mb-[30px]'/>


      {/* 목록 */}
      {loading ? (
        <div className="p-4 text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="p-4 text-danger">목록을 불러오지 못했습니다.</div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <div className="text-[40px]">🐾</div>
          <p className="text-[14px]">아직 남긴 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedComments.map((group) => (
            <CommentCard
              key={group.postId}
              group={group}
              onClick={() =>
                navigate(`/community/${group.postId}`, {
                  state: { from: "mypageComments" }
                })
              }
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default MypageComments
