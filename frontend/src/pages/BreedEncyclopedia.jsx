// 견종백과 — dog_breeds(394종) 마스터를 검색·필터로 둘러보는 페이지.
// 데이터: BE GET /api/breeds (인증 불필요, 풀필드 반환). 목록을 한 번에 받아
//         클라이언트에서 즉시 검색/필터(이름 한·영 부분일치 + 크기). 상세는 모달.
import { useEffect, useMemo, useState } from 'react'
import { searchBreeds } from '../api/breeds'

const SIZE_FILTERS = ['전체', '소형', '중형', '대형']

// 크기/활동량 배지 색 토큰
const SIZE_BADGE = {
  소형: 'bg-sky-100 text-sky-700',
  중형: 'bg-brand-100 text-orange-700/90',
  대형: 'bg-purple-100 text-purple-700',
}

// 내성(1~5) 막대 — 채워진 칸 색으로 더위/추위 강도 표현
function ToleranceBar({ icon, label, value, color }) {
  const v = Number(value) || 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-txtcolor-400 w-11 shrink-0">{icon} {label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i <= v ? color : 'bg-txtcolor-100'}`}
          />
        ))}
      </div>
    </div>
  )
}

function Badges({ breed }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`px-2 py-[2px] rounded-full text-[11px] font-semibold ${SIZE_BADGE[breed.size] || 'bg-txtcolor-100 text-txtcolor-500'}`}>
        {breed.size || '크기 미상'}
      </span>
      <span className="px-2 py-[2px] rounded-full text-[11px] font-medium bg-txtcolor-100/60 text-txtcolor-500">
        {breed.coatType || '털 미상'}
      </span>
      {breed.isBrachycephalic && (
        <span className="px-2 py-[2px] rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
          단두종
        </span>
      )}
    </div>
  )
}

function BreedCard({ breed, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-xl shadow-sm border border-txtcolor-100/50
                 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-[15px] font-bold text-txtcolor-700 leading-snug break-words">
            {breed.nameKr}
          </h3>
          {breed.nameEn && (
            <p className="text-[12px] text-txtcolor-300 break-words">{breed.nameEn}</p>
          )}
        </div>
        <Badges breed={breed} />
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-txtcolor-500 mt-1">
          {(breed.avgWeightMin != null || breed.avgWeightMax != null) && (
            <span>⚖️ {breed.avgWeightMin}~{breed.avgWeightMax}kg</span>
          )}
          {breed.avgLifespan != null && <span>🎂 {breed.avgLifespan}년</span>}
          {breed.requiredActivity && <span>🏃 활동 {breed.requiredActivity}</span>}
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <ToleranceBar icon="🌡️" label="더위" value={breed.heatTolerance} color="bg-orange-400" />
          <ToleranceBar icon="❄️" label="추위" value={breed.coldTolerance} color="bg-sky-400" />
        </div>
      </div>
    </button>
  )
}

function BreedModal({ breed, onClose }) {
  if (!breed) return null
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[20px] font-extrabold text-txtcolor-700 break-words">{breed.nameKr}</h2>
            {breed.nameEn && <p className="text-[13px] text-txtcolor-300 break-words">{breed.nameEn}</p>}
          </div>
          <button onClick={onClose} className="text-txtcolor-300 hover:text-txtcolor-600 text-[20px] shrink-0">✕</button>
        </div>
        <Badges breed={breed} />

        <dl className="grid grid-cols-2 gap-3 mt-5">
          <Field label="평균 체중" value={breed.avgWeightMin != null ? `${breed.avgWeightMin}~${breed.avgWeightMax}kg` : '정보 없음'} />
          <Field label="평균 수명" value={breed.avgLifespan != null ? `${breed.avgLifespan}년` : '정보 없음'} />
          <Field label="필요 활동량" value={breed.requiredActivity || '정보 없음'} />
          <Field label="털 종류" value={breed.coatType || '정보 없음'} />
        </dl>

        <div className="mt-5 flex flex-col gap-2 bg-txtcolor-100/30 rounded-xl p-4">
          <ToleranceBar icon="🌡️" label="더위" value={breed.heatTolerance} color="bg-orange-400" />
          <ToleranceBar icon="❄️" label="추위" value={breed.coldTolerance} color="bg-sky-400" />
          <p className="text-[11px] text-txtcolor-400 mt-1">
            내성이 낮을수록(왼쪽) 해당 날씨에 취약해요. 산책지수에도 반영됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[12px] text-txtcolor-400">{label}</dt>
      <dd className="text-[14px] font-semibold text-txtcolor-700">{value}</dd>
    </div>
  )
}

function BreedEncyclopedia() {
  const [breeds, setBreeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [size, setSize] = useState('전체')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    searchBreeds()
      .then((data) => { if (alive) setBreeds(Array.isArray(data) ? data : []) })
      .catch(() => { if (alive) setBreeds([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return breeds.filter((b) => {
      if (size !== '전체' && b.size !== size) return false
      if (!kw) return true
      return (
        (b.nameKr || '').toLowerCase().includes(kw) ||
        (b.nameEn || '').toLowerCase().includes(kw)
      )
    })
  }, [breeds, keyword, size])

  return (
    <div className="p-4 animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-[32px] font-extrabold text-txtcolor-700">견종백과</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-[4px] h-[20px] rounded-full bg-brand-500" />
          <p className="text-[14px] text-txtcolor-500 font-light">
            {breeds.length}종 견종의 크기·체중·수명·날씨 내성을 한눈에 살펴보세요.
          </p>
        </div>
      </div>
      <div className="w-full h-[1px] bg-txtcolor-400/40 mb-5" />

      {/* 검색 + 크기 필터 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="견종 이름 검색 (한글·영문)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-txtcolor-100 bg-white
                     text-[14px] text-txtcolor-700 placeholder:text-txtcolor-300
                     focus:outline-none focus:border-brand-400"
        />
        <div className="flex gap-1.5">
          {SIZE_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-full text-[13px] transition ${
                size === s
                  ? 'bg-brand-300 text-txtcolor-700 font-semibold'
                  : 'bg-txtcolor-100/40 text-txtcolor-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 */}
      {loading ? (
        <div className="py-16 text-center text-txtcolor-300 text-[14px]">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-txtcolor-300">
          <div className="text-[40px] mb-2">🐕</div>
          <p className="text-[14px]">검색 결과가 없어요.</p>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-txtcolor-400 mb-3">{filtered.length}종</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((b) => (
              <BreedCard key={b.breedId} breed={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </>
      )}

      <BreedModal breed={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default BreedEncyclopedia
