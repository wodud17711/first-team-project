// 위경도 거리 계산 유틸 (산책 경로 거리 측정용)
// 카카오 getLength 대신 자체 haversine — 순수 함수라 단위 테스트 가능.

/** 두 좌표(위경도) 간 거리 km (haversine). */
export function haversineKm(a, b) {
  const R = 6371 // 지구 반지름 km
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** 경로 좌표 배열({lat,lng}[]) → 총 거리 km (0.01km 반올림). 점 1개 이하면 0. */
export function pathDistanceKm(points) {
  if (!Array.isArray(points) || points.length < 2) return 0
  let km = 0
  for (let i = 1; i < points.length; i++) {
    km += haversineKm(points[i - 1], points[i])
  }
  return Math.round(km * 100) / 100
}
