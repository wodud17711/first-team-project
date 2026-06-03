
// [태그 이름 표기(목록, 상세 페이지)]
// 성별에 따른 이름
export const genderMap = {
  F: { text: "여아", icon: "🩷" },
  M: { text: "남아", icon: "🩵" },
}

// 활동량 저, 중, 고에 따른 태그이름
export const activityMap = {
  저: "느긋함",
  중: "활기참",
  고: "에너자이저",
}

// 선호 산책 시간에 따른 태그 이름
export const getWalkType = (times) => {
  const hasMorning = times.some((t) => t.includes("오전"))
  const hasAfternoon = times.some((t) => t.includes("오후"))

  if (hasMorning && hasAfternoon) return "종일 산책형"
  if (hasMorning) return "오전 산책형"
  if (hasAfternoon) return "오후 산책형"

  return "미지정"
}




// [정보 입력 함수들(수정, 추가 페이지)]

// 성별 선택 버튼
export const genders = [
  { value: "남아" },
  { value: "여아" },
]

// 체중
export const formatWeight = (value) => {
  value = value.replace(/[^0-9.]/g, "")

  const parts = value.split(".")

  if (parts.length > 2) {
    value = parts[0] + "." + parts[1]
  }

  if (parts[1]?.length > 1) {
    value = parts[0] + "." + parts[1].slice(0, 1)
  }

  return value
}

// 활동량 저, 중, 고에 따른 태그이름
export const activityLevels = [
  { value: "저", label: "느긋함" },
  { value: "중", label: "활기참" },
  { value: "고", label: "에너자이저" },
]

// 선호 산책 시간 선택 목록 배열
export const walkTimes = [
  ...Array.from({ length: 12 }, (_, i) => `오전 ${i}~${i + 1}시`),
  ...Array.from({ length: 12 }, (_, i) => `오후 ${i === 0 ? 12 : i}~${i + 1}시`),
]
