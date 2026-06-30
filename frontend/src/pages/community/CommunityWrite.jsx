import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCategories, submitPost } from "../../hooks/useCommunity"
import { uploadImage, validateImageFile } from "../../api/uploads"
import WalkPathMap from "../../components/WalkPathMap"
import { encodeRoute } from "../../lib/routeEmbed"

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-6 py-5">
      <h3 className="flex items-center text-[20px] font-bold text-txtcolor-700 mb-4">
        <span className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
        {title}
      </h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

const TITLE_MAX = 200

function CommunityWrite() {
  const navigate = useNavigate()
  // dev 미리보기에서도 작성 후 /dev 하위 상세로 이동하도록 base 계산
  const { pathname } = useLocation()
  const base = pathname.startsWith("/dev") ? "/dev/community" : "/community"

  const { categories } = useCategories()

  const [categoryId, setCategoryId] = useState(null)
  const [subTag, setSubTag] = useState(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState([]) // 서버 업로드 후 저장 URL
  const [routePoints, setRoutePoints] = useState([]) // 산책로 경로 좌표(산책로 카테고리)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 선택된 카테고리
  const selectedCategory = categories.find((c) => c.categoryId === categoryId)
  // 선택된 카테고리의 서브태그 (카테고리 바꾸면 초기화)
  const subTags = selectedCategory?.subTags ?? []
  // "산책로 추천" 카테고리에서만 경로 그리기 지도를 노출(이름 기반 — categoryId 는 환경별로 다를 수 있음)
  const isRouteCategory = (selectedCategory?.name ?? "").includes("산책로")

  const handleCategory = (id) => {
    setCategoryId(id)
    setSubTag(null)
  }

  // 이미지 추가 — 최대 5개, 서버 업로드 후 저장 URL 만 보관
  const handleImage = async (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = "" // 같은 파일 재선택 허용
    if (files.length === 0) return

    const room = 5 - imageUrls.length
    if (room <= 0) {
      alert("사진은 최대 5장까지 첨부할 수 있어요.")
      return
    }

    setUploading(true)
    try {
      for (const file of files.slice(0, room)) {
        const invalid = validateImageFile(file)
        if (invalid) {
          alert(invalid)
          continue
        }
        const url = await uploadImage(file)
        setImageUrls((prev) => [...prev, url].slice(0, 5))
      }
    } catch (err) {
      console.error(err)
      alert(err?.message || "이미지 업로드에 실패했어요.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!categoryId) {
      alert("카테고리를 선택해주세요.")
      return
    }
    if (subTags.length > 0 && !subTag) {
      alert("서브태그를 선택해주세요.")
      return
    }
    if (!title.trim()) {
      alert("제목을 입력해주세요.")
      return
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const postId = await submitPost({
        categoryId,
        subTag,
        title: title.trim(),
        // 산책로 카테고리면 그린 경로 좌표를 본문에 임베드(점 2개 미만이면 원본 그대로).
        content: encodeRoute(content.trim(), isRouteCategory ? routePoints : []),
        imageUrls,
      })
      alert("게시글이 등록되었습니다.")
      navigate(`${base}/${postId}`)
    } catch (err) {
      console.error(err)
      alert("등록에 실패했습니다.")
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      const ok = window.confirm("작성 중인 내용이 사라집니다. 취소하시겠습니까?")
      if (!ok) return
    }
    navigate(base)
  }

  const chip =
    "px-3 py-2 rounded-full text-[13px] font-semibold border transition whitespace-nowrap"
    

  return (
    <div className="p-4 animate-fadeIn">
      {/* 상단 */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-txtcolor-700">커뮤니티 글작성</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
            <p className="text-[14px] text-txtcolor-500 font-light">
              사료부터 산책, 소소한 일상까지 나누고 싶은 반려생활 이야기를 남겨보세요.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-[20px]" />

      <div className="flex flex-col gap-4">
        {/* 카테고리 + 서브태그 */}
        <Section title="📂 카테고리">
          <div className="grid grid-cols-5 gap-3">
            {categories.map((c) => (
              <button
                key={c.categoryId}
                type="button"
                onClick={() => handleCategory(c.categoryId)}
                className={`${chip} ${
                  categoryId === c.categoryId
                    ? "bg-brand-200 border-brand-500 text-txtcolor-700"
                    : "bg-white border-txtcolor-100 text-txtcolor-300 hover:bg-txtcolor-100/40 transition"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {subTags.length > 0 && (
            <div className="mt-2 pt-3 border-t border-txtcolor-100" >
              <label className="text-[14px] font-semibold text-txtcolor-700">
                🏷️ 서브태그 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSubTag(subTag === t ? null : t)}
                    className={`px-3 py-1 rounded-full text-[12px] transition ${
                      subTag === t
                        ? "bg-sky-100 text-sky-700 font-medium"
                        : "bg-txtcolor-100/40 text-txtcolor-400"
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* 제목 + 내용 */}
        <Section title="📝 내용">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[14px] font-semibold text-txtcolor-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <span className="text-[12px] text-txtcolor-300">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                        text-txtcolor-700 text-[14px]
                        focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-semibold text-txtcolor-700">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-3 pr-12 bg-txtcolor-50/50 rounded-xl border border-txtcolor-50 
                        text-txtcolor-700 text-[14px]
                        focus:outline-brand-300 hover:bg-txtcolor-100/40 transition"
              placeholder="내용을 입력하세요"
            />
          </div>
        </Section>

        {/* 산책로 (산책로 추천 카테고리 전용) */}
        {isRouteCategory && (
          <Section title="🗺️ 산책로 (선택)">
            <p className="text-[12px] text-txtcolor-300 -mt-3">
              지도를 클릭해 추천 산책로를 그려주세요. 점 2개 이상이면 글과 함께 저장돼요.
            </p>
            <WalkPathMap onPathChange={setRoutePoints} />
          </Section>
        )}

        {/* 사진 (선택, mock) */}
        <Section title="📷 사진 (선택)">
          <p className="text-[12px] text-txtcolor-300 -mt-3">최대 5장까지 첨부할 수 있어요.</p>
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, idx) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  className="w-[96px] h-[96px] rounded-xl object-cover border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full hover:bg-txtcolor-50
                            bg-white border border-txtcolor-100 shadow-sm text-red-500 text-[12px]"
                >
                  ✕
                </button>
              </div>
            ))}
            

            {imageUrls.length < 5 && (
              <label className="w-[96px] h-[96px] rounded-xl border border-dashed border-txtcolor-200 flex flex-col
                items-center justify-center text-txtcolor-300 text-[12px] cursor-pointer hover:bg-txtcolor-100/25 transition">
                <span className="text-[22px] leading-none">＋</span>
                사진 추가
                <input type="file" accept="image/*" multiple hidden onChange={handleImage} />
              </label>
            )}
          </div>
          
        </Section>
      </div>

      {/* 저장 / 취소 */}
      <div className="flex justify-end gap-3 mt-[20px] pt-4 
                      border-t border-txtcolor-100/60">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="px-4 py-2 w-[90px] 
                     rounded-xl bg-brand-300 text-txtcolor-700 text-[14px] font-bold
                     shadow-sm hover:bg-brand-400 transition"
        >
          {submitting ? "등록중" : uploading ? "업로드중" : "등록"}
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 w-[90px]
                     rounded-xl bg-txtcolor-100 text-txtcolor-600 text-[14px] font-bold
                     shadow-sm hover:bg-txtcolor-200/60 transition"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default CommunityWrite
