import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '../lib/kakaoMap'

/**
 * 카카오 지도 — 현재 위치 표시 (1차).
 *
 * - SDK 로드(loadKakaoMaps) → geolocation 으로 현재 위치 중심 + 마커.
 * - 위치 권한 거부/미지원/실패 시 데모 타깃 **부산**으로 폴백(안내 배지 표시).
 * - SDK/키 문제로 못 그리면 에러 안내(앱은 안 깨짐).
 *
 * 페이지 레이아웃(어디에 얼마 크기로 둘지)은 호출부에서 결정 — 재사용 컴포넌트.
 *
 * @param {object}  props
 * @param {number} [props.level=4]      카카오 줌 레벨(작을수록 확대)
 * @param {number} [props.height=320]   지도 높이(px)
 * @param {string} [props.className]    래퍼 추가 클래스
 */
export default function KakaoMap({ level = 4, height = 320, className = '' }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const kakao = await loadKakaoMaps()
        if (cancelled || !containerRef.current) return

        const center = await getCurrentCenter()
        if (cancelled || !containerRef.current) return

        const position = new kakao.maps.LatLng(center.lat, center.lng)
        const map = new kakao.maps.Map(containerRef.current, { center: position, level })
        new kakao.maps.Marker({ map, position })

        setUsedFallback(center.fallback)
        setStatus('ready')
      } catch (e) {
        console.error('[KakaoMap]', e)
        if (!cancelled) setStatus('error')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [level])

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden bg-gray-100"
      />

      {status === 'loading' && (
        <Overlay>지도를 불러오는 중…</Overlay>
      )}

      {status === 'error' && (
        <Overlay>지도를 불러오지 못했어요</Overlay>
      )}

      {status === 'ready' && usedFallback && (
        <span className="absolute left-2 bottom-2 px-2 py-1 rounded-md bg-black/60 text-white text-[12px]">
          위치 권한이 없어 부산을 표시 중이에요
        </span>
      )}
    </div>
  )
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
      {children}
    </div>
  )
}

// 데모 타깃 = 부산시청 (geolocation 실패/거부 시 폴백 중심)
const BUSAN = { lat: 35.1796, lng: 129.0756 }

/**
 * 현재 위치를 Promise 로 반환. 실패/거부/미지원 시 부산 폴백({fallback:true}).
 * @returns {Promise<{lat:number, lng:number, fallback:boolean}>}
 */
function getCurrentCenter() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...BUSAN, fallback: true })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          fallback: false,
        }),
      () => resolve({ ...BUSAN, fallback: true }),
      { timeout: 5000, maximumAge: 60000 },
    )
  })
}
