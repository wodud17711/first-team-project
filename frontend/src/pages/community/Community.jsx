import { useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { useCategories, usePosts } from "../../hooks/useCommunity"

// 컴포넌트 import
import PostCard from "../../components/PostCard"

// 카테고리 탭 (전체 + 카테고리 목록)
function CategoryTabs({ categories, selectedId, onSelect }) {
  const base =
    "flex-1 px-4 py-2 text-[14px] font-bold whitespace-nowrap transition"
  return (
    <div className="flex overflow-x-auto bg-white rounded-xl border border-txtcolor-100/50 shadow-sm mb-[20px]">
      <button
        onClick={() => onSelect(null)}
        className={`${base} ${selectedId == null ? 
                  "bg-brand-400 rounded-xl text-txtcolor-700" :  
                  "bg-white text-txtcolor-300 rounded-xl hover:bg-txtcolor-50 hover:text-txtcolor-700"}`}
      >
        전체
      </button>
      {categories.map((c) => (
        <button
          key={c.categoryId}
          onClick={() => onSelect(c.categoryId)}
          className={`${base} ${selectedId === c.categoryId ? 
                    "bg-brand-400 rounded-xl text-txtcolor-700" : 
                    "bg-white text-txtcolor-300 rounded-xl hover:bg-txtcolor-50 hover:text-txtcolor-700"}`}
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

  const [searchParams] = useSearchParams()

  const [page, setPage] = useState(0)

  // 필터 state (카테고리 / 서브태그 / 정렬)
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category")
      ? Number(searchParams.get("category"))
      : null
  )

  useEffect(() => {
    const category = searchParams.get("category")

    setCategoryId(
      category
        ? Number(category)
        : null
    )
  }, [searchParams])
  const [subTag, setSubTag] = useState(null)
  const [sort, setSort] = useState("latest")

  const { categories } = useCategories()
  const { posts, total, totalPages, loading, error } = usePosts({ categoryId, subTag, sort, page })

  const startPage = Math.max(0, page - 2)
  const endPage = Math.min(totalPages, startPage + 5)

  const visiblePages = Array.from(
    { length: endPage - startPage },
    (_, i) => startPage + i
  )

  // 선택된 카테고리의 서브태그 목록 (탭 아래 2차 필터)
  const subTags = categories.find((c) => c.categoryId === categoryId)?.subTags ?? []

  // 카테고리 바꾸면 서브태그 선택 초기화, 첫페이지로 이동
  const handleCategory = (id) => {
    setCategoryId(id)
    setSubTag(null)
    setPage(0)
  }

  return (
    <div className="p-4 animate-fadeIn">

      {/* 상단 */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">커뮤니티</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              사료·산책로·자랑·메이트까지, 보호자끼리 나누는 이야기
            </p>
          </div>
        </div>
        {/* 글쓰기 */}
        <button
          onClick={() => navigate(`${base}/write`)}
          className="flex items-center gap-2 absolute right-0 bottom-0 px-4 py-2 
                     rounded-xl bg-txtcolor-700 text-white text-[14px] font-bold
                     shadow-sm transition hover:bg-txtcolor-900"
        >
          <img src="/write.png" alt="마이페이지" className="w-[14px] h-[14px] invert brightness-0"/> 
          글쓰기
        </button>
      </div>

      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />


      {/* 카테고리 탭 */}
      <CategoryTabs categories={categories} selectedId={categoryId} onSelect={handleCategory} />

      {/* 개수 + 서브카테 + 최신/인기 */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-[13px] text-txtcolor-400">총 {total}개</p>
        <div className="flex items-center gap-[2px]">
          {/* 서브태그 (카테고리 선택 시) */}
          {subTags.length > 0 && (
            <div className="flex gap-1 flex-wrap items-center">
              {subTags.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSubTag(subTag === t ? null : t)
                    setPage(0)
                  }}
                  className={`px-3 py-1 rounded-full text-[12px] transition
                    ${subTag === t ? "bg-sky-100 text-sky-700 font-medium" : "bg-txtcolor-100/40 text-txtcolor-400"}`}
                >
                  #{t}
                </button>
              ))}
              <div className="w-px h-4 bg-gray-400 mx-3" />
            </div>
          )}

          <div className="flex gap-1">
            {[["latest", "최신순"], ["popular", "인기순"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setSort(key)
                  setPage(0)
                }}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition
                  ${sort === key ? "bg-brand-400 text-txtcolor-700" : "text-txtcolor-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="p-4 text-txtcolor-300">불러오는 중...</div>
      ) : error ? (
        <div className="p-4 text-danger">목록을 불러오지 못했습니다.</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-txtcolor-300">
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

      {totalPages > 1 && (
      <div className="flex justify-center items-center gap-1 mt-8">
        
        <button
          disabled={page === 0}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-3 py-1 text-sm rounded-lg border disabled:opacity-30"
        >
          &lt;
        </button>

        {visiblePages.map((i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-8 h-8 rounded-lg text-[12px]
              ${
                page === i
                  ? "bg-sky-700 text-white"
                  : "hover:bg-gray-100"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={page === totalPages - 1}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-3 py-1 text-sm rounded-lg border disabled:opacity-30"
        >
          &gt;
        </button>

      </div>
      )}
    </div>
  )
}

export default Community
