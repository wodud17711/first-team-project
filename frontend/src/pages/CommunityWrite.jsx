import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useCategories, submitPost } from "../hooks/useCommunity"

// DogCreatePage 의 Section 카드 패턴(정선혜 sky 톤)을 그대로 따름.
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm px-6 py-5">
      <h3 className="flex items-center text-[20px] font-bold text-sky-900 mb-4">
        <span className="w-1 h-4 bg-sky-700 rounded-full mr-2" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
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
  const [imageUrls, setImageUrls] = useState([]) // mock: objectURL 미리보기
  const [submitting, setSubmitting] = useState(false)

  // 선택된 카테고리의 서브태그 (카테고리 바꾸면 초기화)
  const subTags = categories.find((c) => c.categoryId === categoryId)?.subTags ?? []

  const handleCategory = (id) => {
    setCategoryId(id)
    setSubTag(null)
  }

  // 이미지 추가 (mock — 최대 5개, objectURL 로 미리보기만)
  const handleImage = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const urls = files.map((f) => URL.createObjectURL(f))
    setImageUrls((prev) => [...prev, ...urls].slice(0, 5))
    e.target.value = "" // 같은 파일 재선택 허용
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
        content: content.trim(),
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
    "px-4 py-2 rounded-full text-[13px] font-medium border transition whitespace-nowrap"

  return (
    <div className="p-4 animate-fadeIn max-w-[820px]">

      {/* 상단 */}
      <div className="mb-4">
        <h1 className="text-[32px] font-extrabold text-sky-800">글쓰기</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-[4px] h-[20px] rounded-full bg-sky-700" />
          <p className="text-[14px] text-gray-500 font-light">
            견주끼리 나누고 싶은 이야기를 남겨보세요.
          </p>
        </div>
      </div>
      <div className="w-full h-[1px] bg-sky-700/50 mb-[30px]" />

      <div className="flex flex-col gap-4">
        {/* 카테고리 + 서브태그 */}
        <Section title="📂 카테고리">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.categoryId}
                type="button"
                onClick={() => handleCategory(c.categoryId)}
                className={`${chip} ${
                  categoryId === c.categoryId
                    ? "bg-sky-700 text-white border-sky-700"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {subTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {subTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubTag(subTag === t ? null : t)}
                  className={`px-3 py-[6px] rounded-full text-[12px] transition ${
                    subTag === t
                      ? "bg-sky-100 text-sky-700 font-medium"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* 제목 + 내용 */}
        <Section title="📝 내용">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[14px] font-semibold text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <span className="text-[12px] text-gray-400">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-4 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px]
                focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-semibold text-gray-700">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full p-3 bg-[#f7f7f7] rounded-xl border border-gray-100 text-[16px] resize-none
                focus:outline-brand-300 hover:bg-[#F0F0F0] transition"
              placeholder="내용을 입력하세요"
            />
          </div>
        </Section>

        {/* 사진 (선택, mock) */}
        <Section title="📷 사진 (선택)">
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, idx) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  className="w-[96px] h-[96px] rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border text-red-500 text-[12px] shadow"
                >
                  ✕
                </button>
              </div>
            ))}

            {imageUrls.length < 5 && (
              <label className="w-[96px] h-[96px] rounded-lg border border-dashed border-gray-300 flex flex-col
                items-center justify-center text-gray-400 text-[12px] cursor-pointer hover:bg-gray-50 transition">
                <span className="text-[22px] leading-none">＋</span>
                사진 추가
                <input type="file" accept="image/*" multiple hidden onChange={handleImage} />
              </label>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-1">최대 5장까지 첨부할 수 있어요.</p>
        </Section>
      </div>

      {/* 저장 / 취소 */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 w-[90px] bg-sky-500 text-white rounded-xl disabled:opacity-60"
        >
          {submitting ? "등록중" : "등록"}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-2 w-[90px] bg-danger text-white text-[14px] font-bold rounded-xl"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default CommunityWrite
