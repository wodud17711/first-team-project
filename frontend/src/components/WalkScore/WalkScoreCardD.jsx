function CircularScore({ scoreText, clamped, label, color }) {
  const size = 150;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = (clamped / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center justify-center">
      
      <div className="relative w-[150px] h-[150px]">
        
        <svg width={size} height={size} className="-rotate-90">
          
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="none"
          />

          {/* 진행 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-bold">
            {scoreText}점
          </span>
          <span className="text-[12px] text-gray-500">
            /100
          </span>
        </div>
      </div>

      {/* 라벨 */}
      <span className="mt-2 text-[15px] font-bold text-green-600">
        {label}
      </span>
    </div>
  );
}

function WalkScoreCardD({
  scoreText,
  label,
  color,
  clamped,
  weatherItems
}) {
  return (
    <div className="grid grid-cols-[1fr_2fr]">
      {/* 점수 */}
      <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4 w-full">
        
        <div className="flex flex-col items-center text-center">
          <CircularScore
            scoreText={scoreText}
            clamped={clamped}
            label={label}
            color={color}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4 w-full">
        
        <div className="flex flex-col items-center text-center">
          {/* 날씨 */}
              <div className="flex items-center mt-4 overflow-x-auto">
              {weatherItems.map((item, index) => (
                  <div key={index} className="flex items-center shrink-0">

                    {/* 여기에서 바로 렌더링 */}
                    <div className="flex flex-col items-center px-4 sm:px-[28px]">

                        <p className="text-[12px] text-gray-400">
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
export default WalkScoreCardD