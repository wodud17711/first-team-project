/**
 * 홈 산책지수 카드의 날씨 줄 표시용 포맷터 (순수 함수).
 *
 * BE `/api/walk/score` 응답의 `weather` 블록은 숫자 원본을 그대로 준다
 * (backend/.../walk/dto/WalkScoreResponse.Weather). 등급 라벨 변환은 표현 영역이라
 * 여기(FE)서 처리한다. 값이 없거나(null/undefined) 미연동(예: uvIndex)일 때는 '–' 로 방어한다.
 *
 * 등급 기준 정본:
 * - 미세먼지(pm10, ㎍/㎥): 환경부 통합대기환경지수 — 좋음 0~30 / 보통 31~80 / 나쁨 81~150 / 매우나쁨 151~
 * - 초미세먼지(pm25, ㎍/㎥): 좋음 0~15 / 보통 16~35 / 나쁨 36~75 / 매우나쁨 76~
 * - 바람(m/s): 기상청 — 약함 0~3 / 보통 4~8 / 강함 9~13 / 매우강함 14~
 * - 자외선(지수): 기상청 — 낮음 0~2 / 보통 3~5 / 높음 6~7 / 매우높음 8~10 / 위험 11~
 */

const NA = '–'

const isNil = (v) => v === null || v === undefined

/** 기온/체감/지면온도 → "25℃" (반올림). 값 없으면 '–'. */
export function formatTemp(v) {
  return isNil(v) ? NA : `${Math.round(v)}℃`
}

/** 습도 → "75%" (반올림). 값 없으면 '–'. */
export function formatHumidity(v) {
  return isNil(v) ? NA : `${Math.round(v)}%`
}

/** 미세먼지(pm10) 등급 라벨. */
export function pm10Label(v) {
  if (isNil(v)) return NA
  if (v <= 30) return '좋음'
  if (v <= 80) return '보통'
  if (v <= 150) return '나쁨'
  return '매우나쁨'
}

/** 바람(풍속 m/s) 등급 라벨. */
export function windLabel(v) {
  if (isNil(v)) return NA
  if (v <= 3) return '약함'
  if (v <= 8) return '보통'
  if (v <= 13) return '강함'
  return '매우강함'
}

/** 자외선(지수) 등급 라벨. */
export function uvLabel(v) {
  if (isNil(v)) return NA
  if (v <= 2) return '낮음'
  if (v <= 5) return '보통'
  if (v <= 7) return '높음'
  if (v <= 10) return '매우높음'
  return '위험'
}

/**
 * 카드 weatherItems 배열 생성. weather 가 없으면(미등록/로딩/오류) 전부 '–' 로 채운다.
 *
 * @param {object|null|undefined} weather BE weather 블록
 *        { temperature, groundTemperature, humidity, windSpeed, uvIndex, pm10, ... }
 * @param {string} icon 날씨 아이콘 (sky 데이터 부재로 현재는 고정 이미지)
 */
export function buildWeatherItems(weather, icon) {
  const w = weather ?? {}

  return [
    {
      label: '날씨',
      icon,
    },
    {
      label: '기온',
      value: formatTemp(w.temperature),
    },
    {
      label: '지면온도',
      value: formatTemp(w.groundTemperature),
      icon: '/walkscoreD/groundtemperature.png'
    },
    {
      label: '습도',
      value: formatHumidity(w.humidity),
      icon: '/walkscoreD/humidity.png'
    },
    {
      label: '미세먼지',
      value: pm10Label(w.pm10),
      icon: '/walkscoreD/finedust.png'
    },
    {
      label: '바람',
      value: windLabel(w.windSpeed),
      icon: '/walkscoreD/wind.png'
    },
    {
      label: '자외선',
      value: uvLabel(w.uvIndex),
      icon: '/walkscoreD/uv.png'
    },
  ]
}
