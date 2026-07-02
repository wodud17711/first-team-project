function WalkScoreCard({
  scoreText,
  label,
  color,
  clamped,
  weatherItems
}) {
  return (
    <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4 w-full">
      <span className="inline-flex px-3 py-1 mb-5 rounded-full
                      text-[13px] font-bold text-brand-700 bg-brand-100"
      >
        오늘의 산책지수
      </span>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">

        {/* 점수 */}
        <div className="flex flex-col items-center w-full sm:w-[125px] text-center">
          <div className="flex items-end gap-1">
            <span className="text-[48px] font-bold">
              {scoreText}
            </span>
            <span className="text-[18px] text-gray-500">
              /100
            </span>
          </div>

          <span className="text-[15px] font-bold text-green-600">
            {label}
          </span>
        </div>

        {/* 게이지 + 날씨 */}
        <div className="w-full sm:flex-1 min-w-0">

          {/* 게이지 */}
          <div className="h-[14px] bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${clamped}%` }}
            />
          </div>

          {/* 날씨 */}
            <div className="flex items-center mt-4 overflow-x-auto">
            {weatherItems.map((item, index) => (
                <div key={index} className="flex items-center shrink-0">

                  {/* 여기에서 바로 렌더링 */}
                  <div className="flex flex-col items-center px-4 sm:px-[28px]">

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
                          <p className="text-[16px] font-bold">
                          {item.value}
                          </p>
                      )}
                      </div>

                  </div>

                  {/* 구분선 */}
                  {index !== weatherItems.length - 1 && (
                  <div className="w-px h-8 bg-gray-200" />
                  )}

                </div>
            ))}
            </div>

        </div>
      </div>
    </div>
  )
}
export default WalkScoreCard