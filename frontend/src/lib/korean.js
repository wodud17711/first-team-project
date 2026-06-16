// 한국어 호칭/조사 보정 유틸 (반려견 이름 등 사용자 입력 이름에 자연스러운 조사 부여)

/** 문자열 마지막 글자에 받침(종성)이 있으면 true. 한글 음절이 아니면 false. */
export function hasFinalConsonant(str) {
  if (!str) return false
  const code = str.charCodeAt(str.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false // 한글 음절 영역 밖(영문·숫자 등)
  return (code - 0xac00) % 28 !== 0
}

/**
 * 이름을 호칭형으로 변환. 받침 있는 이름엔 '이'를 붙여 부드럽게 부른다.
 *   호빵 → 호빵이, 콩이 → 콩이, 누리 → 누리, Max → Max
 * 결과가 항상 모음으로 끝나므로 뒤에 '와/가/는/를' 을 붙여도 자연스럽다.
 * (예: `${subjectName(name)}와 산책` → "호빵이와 산책" / "콩이와 산책")
 */
export function subjectName(name) {
  if (!name) return ''
  return hasFinalConsonant(name) ? name + '이' : name
}
