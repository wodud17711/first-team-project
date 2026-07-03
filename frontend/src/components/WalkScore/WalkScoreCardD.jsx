import { useState } from "react";


function CircularScore({ scoreText, clamped, label, color, dogName, profileImageUrl, loading }) {
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const isInactive = loading || scoreText === "--" || clamped === 0; 

  const progress = (clamped / 100) * circumference;
  const offset = circumference - progress;

  const [imgError, setImgError] = useState(false)
  

  return (
    <div className="flex flex-col items-center justify-center mt-2">
      <div className="relative w-[160px] h-[160px] mb-4">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="none"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isInactive ? "#E5E7EB" : color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[40px] text-txtcolor-700 font-extrabold">
            {scoreText}점
          </span>
          <span className="-mt-2 text-[16px] font-medium text-txtcolor-400">
            /100
          </span>
        </div>
      </div>
      

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
  );
}

function WalkScoreCardD({
  scoreText,
  label,
  color,
  title,
  desc,
  clamped,
  weatherItems,
  dogName,
  profileImageUrl,
  tipText
}) {


  const weatherCards = [
    [{ items: [weatherItems[0], weatherItems[1]] }], // 👈 날씨 + 기온 합친 "1카드"
    [{ item: weatherItems[2] }], // 지면온도
    [{ item: weatherItems[3] }, { item: weatherItems[4] }], // 습도 / 미세먼지
    [{ item: weatherItems[5] }, { item: weatherItems[6] }], // 바람 / 자외선
  ]

  return (
    <div>
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        {/* 점수 */}
        <div className="bg-white rounded-xl border border-txtcolor-100/50 shadow-sm px-5 py-4 w-full">
          
          <div className="flex flex-col items-center text-center">
            {/* 🐶 프로필 + 문구 */}
            {dogName && (
              <div className="w-full flex items-center justify-center gap-2 p-2 mb-4
                              bg-txtcolor-50/50 border border-txtcolor-50 rounded-xl">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    className="w-10 h-10 rounded-full object-cover shadow"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full shadow bg-txtcolor-50 border flex items-center justify-center">
                    <span className="text-[18px]">🐶</span>
                  </div>
                )}

                <p className="text-[13px] text-txtcolor-500 mt-1">
                  <span className="font-bold">{dogName}</span>에게 맞는 산책지수를 보고 있어요
                </p>
              </div>
            )}

            <span className="text-txtcolor-700 text-[16px] font-bold mb-1">{title}</span>
            <CircularScore
              scoreText={scoreText}
              clamped={clamped}
              label={label}
              color={color}
              dogName={dogName}
            />
            
          </div>
        </div>

        <div className="w-full flex flex-col items-center text-center">
          {/* 날씨 */}
          <div className="w-full flex flex-col gap-3">
          {weatherCards.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-3">

              {row.map((cell, i) => (
                <div
                  key={i}
                  className="flex-1 bg-white border border-txtcolor-100/50 
                            rounded-xl px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-col items-center">

                    {cell.items ? (
                      <div className="flex items-center gap-2">
                        
                        <img
                          src={cell.items[0].icon}
                          className="w-[20px] h-[20px]"
                          alt="weather-icon"
                        />

                        <span className="text-[16px] font-bold">
                          {cell.items[1].value}
                        </span>

                      </div>
                    ) : (
                      <>
                        <p className="text-[12px] text-gray-400">
                          {cell.item.label}
                        </p>

                        <div className="h-[35px] flex items-center justify-center">
                          {cell.item.icon ? (
                            <img src={cell.item.icon} className="w-[20px] h-[20px]" />
                          ) : (
                            <p className="text-[16px] font-bold">
                              {cell.item.value}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                </div>
              ))}

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
export default WalkScoreCardD