import { useState } from "react";

function getTempStatus(temp) {
  if (temp == null) {
    return {
      label: "정보 없음",
      reason: "기온 데이터를 확인할 수 없어요"
    }
  }

  const t = Number(String(temp).replace(/[^0-9.-]/g, ""))

  if (Number.isNaN(t)) {
    return {
      label: "정보 없음",
      reason: "기온 값을 읽을 수 없어요"
    }
  }

  // 최적 구간
  if (t >= 10 && t <= 25) {
    return {
      label: "산책하기 좋아요",
      reason: "강아지 체온 유지에 가장 적합한 온도예요"
    }
  }

  // 살짝 추움
  if (t >= 5 && t < 10) {
    return {
      label: "주의가 필요해요",
      reason: "기온이 낮아 체온이 낮아질 수 있어요"
    }
  }

  // 살짝 더움
  if (t > 25 && t <= 30) {
    return {
      label: "주의가 필요해요",
      reason: "기온이 올라 체온 조절이 어려울 수 있어요"
    }
  }

  // 추움
  if (t <= 5) {
    return {
      label: "위험해요",
      reason: "기온이 낮아 장시간 산책은 피하는 게 좋아요"
    }
  }

  // 폭염
  if (t > 30) {
    return {
      label: "위험해요",
      reason: "지면 온도와 함께 체온 위험이 높아질 수 있어요"
    }
  }

  return {
    label: "주의가 필요해요",
    reason: "현재 온도 상태를 확인하면서 산책하세요"
  }
}

function getGroundTempStatus(temp) {
  if (temp == null) {
    return {
      label: "정보 없음",
      reason: "지면온도 데이터가 아직 없어요"
    }
  }

  const t = Number(String(temp).replace(/[^0-9.-]/g, ""))

  if (Number.isNaN(t)) {
    return {
      label: "정보 없음",
      reason: "온도 값을 읽을 수 없어요"
    }
  }

  if (t >= 10 && t <= 25) {
    return {
      label: "산책하기 좋아요",
      reason: "지면이 너무 뜨겁지도 차갑지도 않은 적정 온도예요"
    }
  }

  if (t >= 5 && t < 10) {
    return {
      label: "주의가 필요해요",
      reason: "지면이 다소 차가워서 발바닥이 시릴 수 있어요"
    }
  }

  if (t > 25 && t <= 30) {
    return {
      label: "주의가 필요해요",
      reason: "지면이 뜨거워져서 발바닥 화상 위험이 있어요"
    }
  }

  if (t <= 5) {
    return {
      label: "위험해요",
      reason: "지면이 너무 차가워 장시간 산책은 위험해요"
    }
  }

  return {
    label: "위험해요",
    reason: "지면 온도가 극단적으로 높아 위험할 수 있어요"
  }
}


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
    [
      {
        type: "main",
        items: [weatherItems[0], weatherItems[1]],
      },
      {
        type: "groundTemp",
        item: weatherItems[2],
      },
    ],

    [
      { type: "humidity", item: weatherItems[3] },
      { type: "pm", item: weatherItems[4] },
      { type: "wind", item: weatherItems[5] },
      { type: "uv", item: weatherItems[6] },
    ],
  ]

  return (
    <div>
      <div className="grid grid-cols-[1.2fr_1.8fr] gap-4 items-stretch">
        {/* 점수(왼쪽) */}
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
            
        {/* 날씨(오른쪽) */}
        <div className="w-full h-full flex flex-col gap-3 px-5 py-4
                        bg-white rounded-xl border border-txtcolor-100/50 shadow-sm">

          {weatherCards.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={rowIndex === 0
                ? "grid grid-cols-2 gap-3"
                : "grid grid-cols-4 gap-3"
              }
            >
              {row.map((cell, i) => (
                <div
                  key={i}
                  className="
                    rounded-2xl px-4 py-4
                    bg-txtcolor-50/50 border border-txtcolor-50 shadow-sm
                  "
                >

                  {/* 1. 메인 (날씨 + 온도) */}
                  {cell.type === "main" && (() => {
                    const status = getTempStatus(cell.items[1].value)

                    return (
                      <div className="flex flex-col items-center justify-between w-full h-[135px]">
                        <p className="text-[13px] text-txtcolor-500 font-medium text-center
                                        border-b border-txtcolor-100 w-full pb-2">
                          날씨·기온
                        </p>

                        <div className="flex items-center gap-2">
                          <img
                            src={cell.items[0].icon}
                            className="w-[30px] h-[30px] mt-3"
                          />

                          <span className="text-[36px] font-bold text-txtcolor-700 mt-4">
                            {cell.items[1].value}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <p className="text-[12px] mt-1 text-txtcolor-400 leading-snug">
                            {status.reason}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* 2. 지면온도 (강조 가능) */}
                  {cell.type === "groundTemp" && (() => {
                    const status = getGroundTempStatus(cell.item.value)

                    return (
                      <div className="flex flex-col items-center justify-between h-[135px]">
                        <p className="text-[13px] text-txtcolor-500 font-medium text-center
                                        border-b border-txtcolor-100 w-full pb-2">
                          {cell.item.label}
                        </p>

                        <div className="flex items-center gap-2">
                          {cell.item.icon && (
                            <img
                              src={cell.item.icon}
                              className="w-[30px] h-[30px] mt-3"
                              alt="ground-temp-icon"
                            />
                          )}
                          <p className="text-[36px] font-bold text-txtcolor-700 mt-4">
                            {cell.item.value}
                          </p>
                        </div>
                        

                        <div className="flex flex-col items-end">
                          <p className="text-[12px] mt-1 text-txtcolor-400 leading-snug">
                            {status.reason}
                          </p>
                        </div>

                      </div>
                    )
                  })()}

                  {/* 3. 일반 카드 */}
                  {["humidity", "pm", "wind", "uv"].includes(cell.type) && (
                    <div className="flex flex-col items-center h-[100px]">

                      <p className="text-[13px] text-txtcolor-500 font-medium text-center
                                    border-b border-txtcolor-100 w-full pb-2">
                        {cell.item.label}
                      </p>

                      <div className="flex items-center gap-2 mt-7">
                        {cell.item.icon && (
                          <img src={cell.item.icon} className="w-[20px] h-[20px]" />
                        )}

                        <p className="text-[20px] font-bold text-txtcolor-700">
                          {cell.item.value}
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              ))}
            </div>
          ))}
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