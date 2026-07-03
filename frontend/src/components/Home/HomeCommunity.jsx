import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// hooks (실 API 연결)
import { usePosts } from '../../hooks/useCommunity'


function HomeCommunity() {

  const navigate = useNavigate()

  // 커뮤니티
  const { pathname } = useLocation()
  const base = pathname.startsWith("/dev") ? "/dev/community" : "/community"

  // 새 글 판별(24시간 기준)
  function isNewPost(createdAt) {
    if (!createdAt) return false

    const diff = Date.now() - new Date(createdAt).getTime()

    return diff < 24 * 60 * 60 * 1000 // 24시간
  }

  const { posts: posts1 } = usePosts({ categoryId: 1, page: 0, sort: "latest" })
  const { posts: posts2 } = usePosts({ categoryId: 2, page: 0, sort: "latest" })
  const { posts: posts3 } = usePosts({ categoryId: 3, page: 0, sort: "latest" })
  const { posts: posts4 } = usePosts({ categoryId: 4, page: 0, sort: "latest" })
  const { posts: posts5 } = usePosts({ categoryId: 5, page: 0, sort: "latest" })

  const preview = [
    { id: 1, label: '사료·간식', posts: posts1 },
    { id: 2, label: '병원·영양제', posts: posts2 },
    { id: 3, label: '산책로 추천', posts: posts3 },
    { id: 4, label: '반려견 자랑', posts: posts4 },
    { id: 5, label: '산책 메이트 찾기', posts: posts5 },
  ]

  const [index, setIndex] = useState(1)
  const [isAnimating, setIsAnimating] = useState(true)

  const next = () => {
  if (index === slides.length - 1) return
  setIndex(prev => prev + 1)
}

const prev = () => {
  if (index === 0) return
  setIndex(prev => prev - 1)
}
  
const slides = [
  preview[preview.length - 1],
  ...preview,
  preview[0],
]

const handleTransitionEnd = () => {
if (index === slides.length - 1) {
  setIsAnimating(false)
  setIndex(1)
}

if (index === 0) {
  setIsAnimating(false)
  setIndex(slides.length - 2)
}
}

useEffect(() => {
  if (!isAnimating) {
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })
  }
}, [index])

  return (
    <section className="my-6">
      <div className='flex items-center justify-between mb-4 pb-2 border-b border-txtcolor-100'>
        <button
          onClick={() => navigate(`/community`)}
          className="group flex items-center gap-2 text-[30px] font-extrabold text-txtcolor-700"
        >
          커뮤니티
          <span className="text-[20px] font-medium transition-transform duration-200 group-hover:translate-x-1">
            ›
          </span>
        </button>

        <div className='flex items-center gap-3'>
          {/* 좌우 버튼 */}
          <button onClick={prev}
                  className="w-9 h-9 flex items-center justify-center rounded-full 
                            bg-txtcolor-700 font-medium text-[20px] text-white 
                            hover:bg-txtcolor-900 shadow-sm transition"
          >
            ‹
          </button>

          <button onClick={next}
                  className="w-9 h-9 flex items-center justify-center rounded-full 
                            bg-txtcolor-700 font-medium text-[20px] text-white 
                            hover:bg-txtcolor-900 shadow-sm transition">
            ›
          </button>
        </div>
      </div>
      
      <div className="relative overflow-hidden">
        <div className="flex gap-4 transition-transform duration-500 ease-in-out"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(calc(-${index * 50}% - ${index * 8}px))`,
                transition: isAnimating ? 'transform 500ms ease-in-out' : 'none',
              }}
        >
          {slides.map((item, idx) => (
            <div key={`${item.id}-${idx}`}
                  className="w-[calc(50%-8px)] shrink-0 bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
                <h3 className="text-[18px] font-bold">
                  {item.label}
                </h3>
              </div>

              <div className="h-[208px] bg-txtcolor-50/50 border border-txtcolor-50 rounded-xl px-2 py-1">
                {(item.posts?.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-[60px] text-txtcolor-300">
                    <div className="text-[30px]">🐾</div>
                    <p className="text-[13px]">아직 게시글이 없어요</p>
                  </div>
                ) : (
                  <ul className="space-y-[1.5px]">
                    {item.posts.slice(0, 5).map((p, idx) => (
                      <li key={p.postId}
                          onClick={() => navigate(`${base}/${p.postId}`)}
                          className={`flex items-center gap-2 text-[13px] text-txtcolor-700 
                                      truncate cursor-pointer p-2 hover:bg-txtcolor-50
                          ${idx !== item.posts.slice(0, 5).length - 1
                              ? "border-b border-txtcolor-100"
                              : ""
                          }
                        `}
                      >
                        {/* 카드가 이미 카테고리별이라 뱃지는 중복 정보 — 좁은 화면(<sm)에선
                            뱃지가 폭을 다 차지해 제목이 안 보이므로 숨긴다 */}
                        <span className="hidden sm:inline-flex shrink-0 px-2 py-[2px] rounded-full bg-sky-100 text-sky-600 text-[12px] font-medium">
                          {p.category}
                        </span>

                        <span className="min-w-0 truncate">
                          {p.title}
                        </span>

                        {isNewPost(p.createdAt) && (
                          <span className="w-1 h-1 mb-2 -ml-[2px] rounded-full bg-red-500 shrink-0" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeCommunity
