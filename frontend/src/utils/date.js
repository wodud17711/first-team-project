/**
 * 생년월일 입력을 BE LocalDate(ISO 'YYYY-MM-DD')로 정규화.
 * 사용자가 자유 텍스트로 "2021-3-1", "2021.3.1", "2021/03/01" 등으로 입력해도
 * 0 패딩된 "2021-03-01" 로 변환한다. 형식이 아니면 null 반환(호출부에서 안내).
 *
 * BE 가 0 패딩 없는 값("2021-3-1")을 LocalDate 로 못 읽어 400(INVALID_INPUT) 나는 문제 방지.
 */
export function normalizeBirthDate(input) {
  if (input == null) return null

  const m = String(input).trim().match(/^(\d{4})[-./\s]+(\d{1,2})[-./\s]+(\d{1,2})$/)
  if (!m) return null

  const year = m[1]
  const month = m[2].padStart(2, "0")
  const day = m[3].padStart(2, "0")

  const mm = Number(month)
  const dd = Number(day)
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  return `${year}-${month}-${day}`
}
