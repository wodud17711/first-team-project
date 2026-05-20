// ============================================================
// 외부 API 작동 테스트 (Node 18+ / 추가 설치 불필요)
// 사용법:
//   1. tools/.env 에 키 입력 (tools/.env.example 복사)
//   2. node tools/test-apis.mjs
// 결과: 콘솔 PASS/FAIL + tools/samples/ 에 응답 JSON 저장
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- .env 수동 파싱 (의존성 없음) ---
function loadEnv() {
  const envPath = join(__dirname, '.env')
  if (!existsSync(envPath)) {
    console.error('❌ tools/.env 파일이 없습니다. tools/.env.example 을 복사해서 키를 채우세요.')
    process.exit(1)
  }
  const env = {}
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const env = loadEnv()
const C = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m', dim: '\x1b[2m' }
const pass = (m) => console.log(`${C.green}✅ PASS${C.reset} ${m}`)
const fail = (m) => console.log(`${C.red}❌ FAIL${C.reset} ${m}`)
const info = (m) => console.log(`${C.dim}   ${m}${C.reset}`)

function save(name, data) {
  const p = join(__dirname, 'samples', name)
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
  info(`샘플 저장: tools/samples/${name}`)
}

// 오늘 날짜 (YYYYMMDD) + 적절한 발표시각
function todayYmd() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
// 현재 시각 기준 직전 발표시각 (02,05,08,11,14,17,20,23시 + 10분)
function latestBaseTime() {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23]
  const now = new Date()
  let hour = now.getHours()
  if (now.getMinutes() < 15) hour -= 1 // 발표 후 10분 여유
  let chosen = slots[0]
  for (const s of slots) if (s <= hour) chosen = s
  return String(chosen).padStart(2, '0') + '00'
}

// ============================================================
// 1. 기상청 단기예보
// ============================================================
async function testWeather() {
  console.log('\n🌤  [1] 기상청 단기예보')
  const key = env.WEATHER_API_KEY
  if (!key) return fail('WEATHER_API_KEY 없음 (tools/.env 확인)')

  const baseDate = todayYmd()
  const baseTime = latestBaseTime()
  const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
    + `?serviceKey=${encodeURIComponent(key)}`
    + `&pageNo=1&numOfRows=100&dataType=JSON`
    + `&base_date=${baseDate}&base_time=${baseTime}&nx=60&ny=127`
  info(`요청: 서울(60,127) ${baseDate} ${baseTime}`)
  try {
    const res = await fetch(url)
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch {
      return fail(`JSON 파싱 실패 (키 인코딩 문제일 수 있음). 응답 앞부분: ${text.slice(0, 120)}`)
    }
    const code = json?.response?.header?.resultCode
    if (code === '00') {
      const items = json.response.body.items.item
      const tmp = items.find((i) => i.category === 'TMP')
      pass(`resultCode 00 · 데이터 ${items.length}건 · 기온(TMP) ${tmp?.fcstValue}℃`)
      save('weather-sample.json', json)
    } else {
      fail(`resultCode ${code} · ${json?.response?.header?.resultMsg}`)
      if (code === '03') info('→ base_time을 더 이전 발표시각으로. 또는 잠시 후 재시도')
      if (code === '30') info('→ 서비스키 미등록. 키 확인')
    }
  } catch (e) { fail(`네트워크 오류: ${e.message}`) }
}

// ============================================================
// 2. 에어코리아 미세먼지
// ============================================================
async function testAirKorea() {
  console.log('\n🌫  [2] 에어코리아 대기오염정보')
  const key = env.AIRQUALITY_API_KEY
  if (!key) return fail('AIRQUALITY_API_KEY 없음 (tools/.env 확인)')

  const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty`
    + `?serviceKey=${encodeURIComponent(key)}`
    + `&returnType=json&sidoName=${encodeURIComponent('서울')}&ver=1.0&numOfRows=5`
  info('요청: 서울 실시간 미세먼지')
  try {
    const res = await fetch(url)
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch {
      return fail(`JSON 파싱 실패. 응답 앞부분: ${text.slice(0, 120)}`)
    }
    const code = json?.response?.header?.resultCode
    if (code === '00') {
      const item = json.response.body.items[0]
      pass(`resultCode 00 · ${item?.stationName ?? '측정소'} PM10 ${item?.pm10Value} / PM2.5 ${item?.pm25Value}`)
      save('airkorea-sample.json', json)
    } else {
      fail(`resultCode ${code} · ${json?.response?.header?.resultMsg}`)
    }
  } catch (e) { fail(`네트워크 오류: ${e.message}`) }
}

// ============================================================
// 3. 카카오 로컬 (키워드 검색)
// ============================================================
async function testKakaoLocal() {
  console.log('\n🗺  [3] 카카오 로컬 API (키워드 검색)')
  const key = env.KAKAO_REST_API_KEY
  if (!key) return fail('KAKAO_REST_API_KEY 없음 (tools/.env 확인)')

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json`
    + `?query=${encodeURIComponent('공원')}&x=126.978&y=37.5665&radius=2000&size=5`
  info('요청: 서울시청 반경 2km 내 "공원"')
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
    const json = await res.json()
    if (res.status === 200 && Array.isArray(json.documents)) {
      const first = json.documents[0]
      pass(`200 OK · 결과 ${json.documents.length}건 · 예: ${first?.place_name} (${first?.distance}m)`)
      save('kakao-keyword-sample.json', json)
    } else {
      fail(`status ${res.status} · ${json?.message ?? JSON.stringify(json).slice(0, 120)}`)
      if (res.status === 401) info('→ Authorization 헤더 확인 (KakaoAK + 공백 + REST키)')
    }
  } catch (e) { fail(`네트워크 오류: ${e.message}`) }
}

// ============================================================
// 실행
// ============================================================
console.log('============================================')
console.log(' 외부 API 작동 테스트')
console.log('============================================')
await testWeather()
await testAirKorea()
await testKakaoLocal()
console.log('\n============================================')
console.log(' 완료. tools/samples/ 의 응답 JSON을 팀에 공유하세요.')
console.log(' (카카오 지도 SDK는 프론트에서 별도 확인)')
console.log('============================================')
