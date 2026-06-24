


// 상대 시간(방금/N분 전/N시간 전) → 그 이상은 YYYY/MM/DD.
function timeAgo(iso) {
  if (!iso) return "—"
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`

  return iso.slice(0, 10).replaceAll("-", "/")
}


// 새 글 판별(24시간 기준)
function isNewPost(createdAt) {
  if (!createdAt) return false

  const diff = Date.now() - new Date(createdAt).getTime()

  return diff < 24 * 60 * 60 * 1000 // 24시간
}

function MetaCount({ icon, count }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-txtcolor-700">{icon}</span>
      <span className="text-txtcolor-300">{count ?? 0}</span>
    </span>
  )
}


// 게시글 1건 카드 (목록 행)
function PostCard({ post, onClick }) {

  // 닉네임 옆 보호자 연차 표기(아이콘)
  const guardianLevelIcon = {
    BEGINNER: "🌱",
    JUNIOR: "🦴",
    SENIOR: "🐕",
    VETERAN: "🏆",
  }
  
  return (
    <div
      onClick={onClick}
      className="
        group flex gap-4 bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4
        cursor-pointer transition-all duration-200
        hover:-translate-y-[2px] hover:shadow-md
      "
    >
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          className="w-[84px] h-[84px] rounded-lg object-cover shrink-0"
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 gap-2">
        <div className="flex items-center gap-[6px]">
          <span className="px-2 py-[2px] rounded-full bg-sky-100 text-sky-600 text-[12px] font-medium">
            {post.category}
          </span>

          {post.subTag && (
            <span className="px-2 py-[2px] rounded-full bg-txtcolor-100/40 text-txtcolor-400 text-[12px]">
              #{post.subTag}
            </span>
          )}
        </div>

        {/* 제목 */}
        <div className="flex items-center gap-1.5">
          <p className="text-[16px] font-bold text-txtcolor-700 truncate
                    transition-colors duration-300 ease-out group-hover:text-brand-700">
            {post.title}
          </p>

          {isNewPost(post.createdAt) && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 -mt-2 shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-3 text-[12px] text-txtcolor-300">
          <div className="flex gap-1">
            <span>{guardianLevelIcon[post.authorLevel]}</span>
            <span className="font-medium text-txtcolor-500">{post.author ?? "익명"}</span>
          </div>
        
          <span>{timeAgo(post.createdAt)}</span>

          <span className="ml-auto flex items-center gap-3">
            <MetaCount icon="💬" count={post.commentCount} />
            <MetaCount icon="❤️" count={post.likeCount} />
            <MetaCount icon="👁" count={post.viewCount} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default PostCard