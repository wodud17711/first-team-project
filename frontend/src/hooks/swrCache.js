/**
 * 페이지 재방문·필터 전환 시 "불러오는 중" 없이 이전 데이터를 즉시 보여주기 위한
 * 모듈 스코프 캐시 (stale-while-revalidate).
 *
 * - 훅은 캐시가 있으면 즉시 표시하고, 항상 백그라운드로 재조회해 최신값으로 갱신한다
 *   → TTL 없이도 데이터가 낡은 채 머물지 않는다. (useWalkScore 의 5분 캐시와 달리
 *   재계산 비용이 없는 단순 조회라 매번 재검증해도 부담이 없다)
 * - 로그인/로그아웃(auth-changed) 시 등록된 캐시를 전부 비워
 *   사용자 간 데이터 섞임(liked 플래그, 내 정보 등)을 방지한다.
 * - 모듈 스코프라 SPA 라우트 이동 간 유지되고, 전체 새로고침 시엔 초기화된다.
 */
import { AUTH_CHANGED_EVENT } from '../api/tokenStorage'

const registry = []

/** auth-changed 시 자동으로 비워지는 Map 캐시를 만든다. */
export function createSwrCache() {
  const cache = new Map()
  registry.push(cache)
  return cache
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_CHANGED_EVENT, () => {
    registry.forEach((c) => c.clear())
  })
}
