import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl mb-4">🐕‍🦺</p>
      <h2 className="text-2xl font-bold mb-2">페이지를 찾을 수 없어요</h2>
      <p className="text-gray-600 mb-6">길을 잃은 것 같네요...</p>
      <Link
        to="/"
        className="inline-block px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-500"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}

export default NotFound
