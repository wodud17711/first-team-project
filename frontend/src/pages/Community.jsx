import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCategories, usePosts } from "../hooks/useCommunity"

// 컴포넌트 import
import PostCard from "../components/PostCard"

// 카테고리 탭 (전체 + 카테고리 목록). 정선혜 dog 페이지 sky 톤 따라감.
function CategoryTabs({ categories, selectedId, onSelect }) {
  const base =
    "px-4 py-[6px] rounded-full text-[14px] font-bold whitespace-nowrap transition"
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`${base} ${selectedId == null ? "bg-sky-700 text-white" : "bg-white text-gray-600 border"}`}
      >
        전체
      </button>
      {categories.map((c) => (
        <button
          key={c.categoryId}
          onClick={() => onSelect(c.categoryId)}
          className={`${base} ${selectedId === c.categoryId ? "bg-sky-700 text-white" : "bg-white text-gray-600 border"}`}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}


function Community() {
  const navigate = useNavigate()
  // dev 미리보기(/dev/community)에서도 글쓰기·상세가 /dev 하위로 이동하도록 base 계산
  const { pathname } = useLocation()
  const base = pathname.startsWith("/dev") ? "/dev/community" : "/community"

  // 필터 state (카테고리 / 서브태그 / 정렬)
  const [categoryId, setCategoryId] = useState(null)
  const [subTag, setSubTag] = useState(null)
  const [sort, setSort] = useState("latest")

  const { categories } = useCategories()
  const { posts, total, loading, error } = usePosts({ categoryId, subTag, sort })

  // 선택된 카테고리의 서브태그 목록 (탭 아래 2차 필터)
  const subTags = categories.find((c) => c.categoryId === categoryId)?.subTags ?? []

  // 카테고리 바꾸면 서브태그 선택 초기화
  const handleCategory = (id) => {
    setCategoryId(id)
    setSubTag(null)
  }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-sky-800">커뮤니티</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-sky-700" />
            <p className="text-[14px] text-gray-500 font-light">
              사료·산책로·자랑·메이트까지, 견주끼리 나누는 이야기
            </p>
          </div>
        </div>

        {/* 글쓰기 */}
        <button
          onClick={() => navigate(`${base}/write`)}
          className="px-4 py-2 rounded-xl bg-sky-700 text-white text-[14px] font-bold
            shadow-sm transition hover:bg-sky-800"
        >
          + 글쓰기
        </button>
      </div>

      {/* 카테고리 탭 */}
      <CategoryTabs categories={categories} selectedId={categoryId} onSelect={handleCategory} />

      {/* 서브태그 (카테고리 선택 시) */}
      {subTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {subTags.map((t) => (
            <button
              key={t}
              onClick={() => setSubTag(subTag === t ? null : t)}
              className={`px-3 py-[2px] rounded-full text-[12px] transition
                ${subTag === t ? "bg-sky-100 text-sky-700 font-medium" : "bg-gray-100 text-gray-500"}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-[1px] bg-sky-700/40 my-[20px]" />

      {/* 정렬 + 개수 */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-[13px] text-gray-500">총 {total}개</p>
        <div className="flex gap-1">
          {[["latest", "최신순"], ["popular", "인기순"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition
                ${sort === key ? "bg-sky-700 text-white" : "text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
              onClick={() => navigate(`${base}/${post.postId}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Community
