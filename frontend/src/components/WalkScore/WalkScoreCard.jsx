function WalkScoreCard({
  scoreText,
  label,
  color,
  clamped,
  weatherItems,
  tipText
}) {
  return (
    <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-5 w-full">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 px-5 py-3">
        <div className="flex flex-col">

          {/* 점수 */}
          <div className="flex flex-col items-center w-full sm:w-[150px] text-center">
            <div className="flex items-center gap-1">
              <span className="text-[56px] font-bold text-txtcolor-700">
                {scoreText}
              </span>
              <span className="mt-6 text-[20px] font-medium text-txtcolor-400">
                /100
              </span>
            </div>
            {/* 빨강은 '위험해요' 전용 — 로딩·미등록 라벨(측정 중/준비 중/–)이 빨강으로 보이면 안 됨 */}
            <span className={`inline-flex items-center px-4 py-1 rounded-full text-[14px] font-semibold
              ${label === '안전해요'
                ? 'bg-green-100 text-green-600'
                : label === '주의가 필요해요'
                ? 'bg-brand-100 text-orange-700/90'
                : label === '위험해요'
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>
        </div>
        
        {/* 게이지 + 날씨 */}
        <div className="w-full sm:flex-1 min-w-0 mt-6">
          {/* 게이지 */}
          <div className="h-[14px] bg-txtcolor-100/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${clamped}%` }}
            />
          </div>

          {/* 날씨 — overflow 컨테이너에 justify-center 를 주면 모바일에서 왼쪽 항목이
              잘린 채 스크롤로도 못 가는 CSS 함정이 있어, 좁은 화면은 start 로 시작한다 */}
          <div className="flex items-center justify-start sm:justify-center mt-4 overflow-x-auto">
          {weatherItems.map((item, index) => (
              <div key={index} className="flex items-center shrink-0">

                {/* 여기에서 바로 렌더링 */}
                <div className="flex flex-col items-center px-4 sm:px-[40px]">

                    <p className="text-[12px] text-txtcolor-300">
                    {item.label}
                    </p>

                    <div className="h-[35px] flex items-center justify-center">
                    {item.icon ? (
                        <img
                        src={item.icon}
                        className="w-[20px] h-[20px] object-contain"
                        />
                    ) : (
                        <p className="text-[18px] font-bold text-txtcolor-700">
                        {item.value}
                        </p>
                    )}
                    </div>

                </div>

                {/* 구분선 */}
                {index !== weatherItems.length - 1 && (
                <div className="w-px h-8 bg-txtcolor-100" />
                )}

              </div>
          ))}
          </div>
        </div>
      </div>

      {/* 오늘의 팁 — 점수가 없으면(로딩·미등록·오류) 팁도 없음 */}
      {tipText && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-[16px] leading-relaxed">
          <span className="font-bold">💡 오늘의 산책 TIP</span>
          <p className="mt-1 text-[14px]">{tipText}</p>
        </div>
      )}
    </div>
  )
}
export default WalkScoreCard