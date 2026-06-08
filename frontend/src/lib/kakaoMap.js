/**
 * 카카오 지도 SDK 동적 로더 (싱글톤)
 * ==================================
 * - 앱키는 환경변수 `VITE_KAKAO_MAP_KEY`에서 읽는다(레포 미커밋, .env 는 gitignore).
 * - `autoload=false` + `kakao.maps.load()` 패턴으로 SDK 준비 완료 시점을 보장.
 * - 한 번만 로드하고 Promise 를 캐시 → 여러 컴포넌트가 동시에 불러도 스크립트는 1개.
 *
 * 사용:
 *   import { loadKakaoMaps } from '../lib/kakaoMap'
 *   const kakao = await loadKakaoMaps()   // kakao.maps.Map(...) 등 사용 가능
 *
 * 카카오 콘솔에서 플랫폼 도메인(개발: http://localhost:5173)을 등록해야 렌더된다.
 */

let loadPromise = null

export function loadKakaoMaps() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY

    if (!appKey) {
      reject(new Error('VITE_KAKAO_MAP_KEY 가 설정되지 않았습니다 (.env 확인)'))
      return
    }

    // 이미 로드된 경우(HMR 등) 재사용.
    if (window.kakao?.maps) {
      resolve(window.kakao)
      return
    }

    const script = document.createElement('script')
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.async = true
    script.onload = () => {
      // autoload=false 이므로 명시적으로 maps 모듈 로드 완료를 기다린다.
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () => {
      loadPromise = null // 실패 시 다음 호출에서 재시도 가능하게 캐시 해제
      reject(new Error('카카오 지도 SDK 로드 실패 (앱키/도메인 등록 확인)'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
