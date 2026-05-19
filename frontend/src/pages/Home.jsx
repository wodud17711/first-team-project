function Home() {
  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-brand-50 to-orange-100 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-brand-600 font-medium mb-1">오늘의 산책</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          산책하기 좋은 날씨예요 🌤
        </h2>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-bold text-brand-600">85</span>
          <span className="text-gray-600">/ 100점</span>
        </div>
        <p className="text-sm text-gray-700 mt-2">
          지면 온도 22°C · 습도 55% · 미세먼지 보통
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">최적 산책 시간</p>
          <p className="text-lg font-semibold mt-1">오후 5시 - 7시</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">이번 주 산책</p>
          <p className="text-lg font-semibold mt-1">3회 · 2시간</p>
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3">💡 오늘의 팁</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          오후 시간대에는 지면 온도가 떨어져 산책하기 좋습니다.
          물을 충분히 챙겨가세요.
        </p>
      </section>
    </div>
  )
}

export default Home
