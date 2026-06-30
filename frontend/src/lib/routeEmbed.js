/**
 * 산책로 경로를 게시글 content 에 임베드/추출하는 유틸.
 *
 * BE 엔티티엔 산책로(경로) 저장 컬럼이 없다(Walk.java 주석: walk_route 는 Phase 2~3 범위).
 * 그래서 "산책로 추천" 글의 경로 좌표를 content 끝에 [[ROUTE]]...[[/ROUTE]] 마커로 끼워
 * 저장한다 → BE 스키마/엔드포인트 변경 없이 동작. 상세 화면은 extractRoute 로 좌표를 꺼내
 * 지도에 그리고, 마커는 본문 텍스트에서 제거한다.
 *
 * 좌표는 [lat,lng] 배열로 소수점 6자리(~0.1m)까지만 저장해 길이를 아낀다.
 */

const MARKER_RE = /\s*\[\[ROUTE\]\]([\s\S]*?)\[\[\/ROUTE\]\]\s*/

/**
 * content 끝에 경로 좌표를 임베드한다. 점이 2개 미만이면 원본 content 그대로 반환.
 * @param {string} content 사용자가 입력한 본문
 * @param {Array<{lat:number,lng:number}>} points
 * @returns {string}
 */
export function encodeRoute(content, points) {
  const text = content ?? ''
  if (!Array.isArray(points)) return text
  const compact = points
    .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
    .map((p) => [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6))])
  if (compact.length < 2) return text
  return `${text}\n\n[[ROUTE]]${JSON.stringify(compact)}[[/ROUTE]]`
}

/**
 * content 에서 경로 마커를 분리한다.
 * @param {string} content
 * @returns {{text:string, points:Array<{lat:number,lng:number}>}}
 *   text: 마커를 제거한 본문 / points: 파싱된 좌표(없으면 [])
 */
export function extractRoute(content) {
  const raw = content ?? ''
  const m = raw.match(MARKER_RE)
  if (!m) return { text: raw, points: [] }

  let points = []
  try {
    const arr = JSON.parse(m[1])
    if (Array.isArray(arr)) {
      points = arr
        .map((c) => (Array.isArray(c) ? { lat: c[0], lng: c[1] } : c))
        .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
    }
  } catch {
    points = [] // 파싱 실패 시 경로 없음 취급(본문만 표시)
  }

  return { text: raw.replace(MARKER_RE, '').trim(), points }
}
