import KakaoMap from '../components/KakaoMap'

function WalkRecord() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🐾 산책 기록</h2>
      <p className="text-gray-600 mb-4">산책 시작/완료 기능과 기록 통계가 들어갈 페이지입니다.</p>

      {/* 1차: 현재 위치 지도. 산책 화면 레이아웃은 FE(정선혜)와 조율 예정 */}
      <KakaoMap height={360} />
    </div>
  )
}

export default WalkRecord
