// 산책 경로 거리 측정 지도 (웹 = GPS 없이 사후 경로 입력)
// ─────────────────────────────────────────────────────────────
// ⚠️ 스캐폴딩(임재영): 거리 계산 로직 + 지도 클릭 경로 그리기. 색/높이/버튼 등
//    비주얼은 정선혜 영역(sky 톤 placeholder).
// 동작: 지도를 클릭해 걸은 경로의 꺾이는 지점을 찍으면 polyline 으로 잇고,
//       좌표를 haversine 으로 합산해 km 를 onDistanceChange 로 올린다.
//       (거리 계산은 카카오 getLength 대신 자체 haversine — 단위 테스트 가능)
import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '../lib/kakaoMap'
import { pathDistanceKm } from '../lib/geo'

// 데모 타깃 = 부산시청 (geolocation 실패/거부 시 폴백)
const BUSAN = { lat: 35.1796, lng: 129.0756 }

function getCurrentCenter() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...BUSAN, fallback: true })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false }),
      () => resolve({ ...BUSAN, fallback: true }),
      { timeout: 5000, maximumAge: 60000 },
    )
  })
}

/**
 * @param {object}   props
 * @param {number}  [props.height=240]
 * @param {(km:number)=>void} [props.onDistanceChange]  경로 변경 시 누적 거리(km) 콜백
 * @param {(points:{lat:number,lng:number}[])=>void} [props.onPathChange]  경로 점 변경 콜백(저장용)
 * @param {{lat:number,lng:number}[]} [props.initialPath]  초기 경로(상세 표시/수정 진입 시 미리 그림)
 * @param {boolean} [props.readOnly=false]  true 면 클릭 편집·컨트롤 비활성(저장 경로 표시 전용)
 */
export default function WalkPathMap({
  height = 240,
  onDistanceChange,
  onPathChange,
  initialPath,
  readOnly = false,
}) {
  const containerRef = useRef(null)
  const kakaoRef = useRef(null)
  const mapRef = useRef(null)
  const polylineRef = useRef(null)
  const markersRef = useRef([])
  const pointsRef = useRef([]) // {lat,lng}[] — 거리 계산용
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [km, setKm] = useState(0)

  const recompute = () => {
    const dist = pathDistanceKm(pointsRef.current)
    setKm(dist)
    onDistanceChange?.(dist)
    onPathChange?.(pointsRef.current.map((p) => ({ lat: p.lat, lng: p.lng })))
  }

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const kakao = await loadKakaoMaps()
        if (cancelled || !containerRef.current) return
        kakaoRef.current = kakao

        const center = await getCurrentCenter()
        if (cancelled || !containerRef.current) return

        const position = new kakao.maps.LatLng(center.lat, center.lng)
        const map = new kakao.maps.Map(containerRef.current, { center: position, level: 4 })
        mapRef.current = map

        const hasInitial = Array.isArray(initialPath) && initialPath.length > 0

        // 출발(현재 위치) 표식 — 새로 그릴 때만. 저장 경로 표시(readOnly/초기경로)에선 무의미.
        // CustomOverlay 는 clickable:false 라 점 위를 클릭해도 지도 click 이 통과됨.
        // ⚠️ 색/크기는 비주얼 placeholder(sky 톤) — 정선혜 영역.
        if (!readOnly && !hasInitial) {
          const dotEl = document.createElement('div')
          dotEl.style.cssText =
            'width:14px;height:14px;border-radius:9999px;background:#0284c7;' +
            'border:2px solid #fff;box-shadow:0 0 0 3px rgba(2,132,199,0.30);'
          new kakao.maps.CustomOverlay({
            map,
            position,
            content: dotEl,
            xAnchor: 0.5,
            yAnchor: 0.5,
            clickable: false,
          })
        }

        const polyline = new kakao.maps.Polyline({
          map,
          path: [],
          strokeWeight: 5,
          strokeColor: '#0284c7',
          strokeOpacity: 0.9,
        })
        polylineRef.current = polyline

        // 초기 경로(상세 표시/수정 진입)를 그려두고 지도를 경로 범위에 맞춘다.
        if (hasInitial) {
          pointsRef.current = initialPath.map((p) => ({ lat: p.lat, lng: p.lng }))
          const lls = pointsRef.current.map((p) => new kakao.maps.LatLng(p.lat, p.lng))
          polyline.setPath(lls)
          if (!readOnly) {
            lls.forEach((ll) =>
              markersRef.current.push(new kakao.maps.Marker({ map, position: ll, clickable: false })),
            )
          }
          const bounds = new kakao.maps.LatLngBounds()
          lls.forEach((ll) => bounds.extend(ll))
          map.setBounds(bounds)
          recompute()
        }

        // 지도 클릭 → 경로 점 추가 (편집 모드만)
        if (!readOnly) {
          kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
            const ll = mouseEvent.latLng
            pointsRef.current.push({ lat: ll.getLat(), lng: ll.getLng() })
            polyline.setPath(pointsRef.current.map((p) => new kakao.maps.LatLng(p.lat, p.lng)))
            markersRef.current.push(new kakao.maps.Marker({ map, position: ll, clickable: false }))
            recompute()
          })
        }

        setStatus('ready')
      } catch (e) {
        console.error('[WalkPathMap]', e)
        if (!cancelled) setStatus('error')
      }
    }
    init()
    return () => {
      cancelled = true
    }
    // 지도/리스너는 마운트 시 1회만 — recompute 는 ref 기반이라 deps 불필요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const undo = () => {
    if (!pointsRef.current.length) return
    pointsRef.current.pop()
    const kakao = kakaoRef.current
    polylineRef.current.setPath(pointsRef.current.map((p) => new kakao.maps.LatLng(p.lat, p.lng)))
    const m = markersRef.current.pop()
    m?.setMap(null)
    recompute()
  }

  const reset = () => {
    pointsRef.current = []
    polylineRef.current?.setPath([])
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    recompute()
  }

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-txtcolor-50/50" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-txtcolor-400 text-sm">
            지도를 불러오는 중…
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-txtcolor-400 text-sm">
            지도를 불러오지 못했어요 (거리는 아래에 직접 입력)
          </div>
        )}
      </div>

      {/* 컨트롤 — 비주얼 placeholder. readOnly(저장 경로 표시)면 거리만 보여주고 편집 버튼 숨김. */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[12px] text-txtcolor-400">
          {readOnly ? (
            <>총 거리 <b className="text-brand-700">{km} km</b></>
          ) : (
            <>지도에 반려견과 함께 걸은 길을 그려보세요. <b className="text-brand-700">({km} km)</b></>
          )}
        </p>
        {!readOnly && (
          <div className="flex gap-2 mt-2">
            <button onClick={undo}
                    className="px-2 py-1 rounded-lg text-[12px] text-white font-medium bg-txtcolor-700 shadow-sm transition hover:bg-txtcolor-900">
              되돌리기
            </button>
            <button onClick={reset}
                    className="px-2 py-1 rounded-lg text-[12px] text-white font-medium bg-txtcolor-700 shadow-sm transition hover:bg-txtcolor-900">
              초기화
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
