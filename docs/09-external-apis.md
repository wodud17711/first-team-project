# 09. 외부 API 사용 가이드

본 서비스에서 사용하는 외부 API의 사용법과 주의사항을 정리합니다.

> ⚠️ **보안 주의**: API 키는 절대 GitHub·채팅·문서에 평문으로 노출하지 마세요. 환경변수로만 관리합니다.

---

## 📋 사용 API 목록

| API | 제공처 | 호출 위치 | 용도 | 한도 |
| --- | --- | --- | --- | --- |
| 단기예보 조회서비스 | 기상청 | 백엔드 | 시간별 날씨 예보 | 10,000회/일 (개발) |
| 생활기상지수 조회서비스 | 기상청 | 백엔드 | 체감온도·자외선 등 | 10,000회/일 (개발) |
| 에어코리아 대기오염정보 | 한국환경공단 | 백엔드 | 미세먼지·초미세먼지 | 10,000회/일 (개발) |
| 지도 SDK (JavaScript) | 카카오 | **프론트** | 지도 표시·마커·경로선 | 300,000회/일 |
| 로컬 API (REST) | 카카오 | 백엔드 | 주소↔좌표 변환, 장소 검색 | 100,000회/일 |

> 💡 **카카오는 호출 위치 주의**: 지도 SDK는 프론트(JS 키), 로컬 API는 백엔드(REST 키). 키가 다릅니다.

---

## 🌤️ 1. 기상청 단기예보 조회서비스

### 기본 정보
- **Endpoint**: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
- **HTTP Method**: GET
- **데이터 형식**: JSON (XML 가능)

### 필수 파라미터

| 파라미터 | 타입 | 설명 | 예시 |
| --- | --- | --- | --- |
| `serviceKey` | String | 인증키 (Encoding) | (환경변수) |
| `pageNo` | Integer | 페이지 번호 | 1 |
| `numOfRows` | Integer | 한 페이지 결과 수 | 1000 |
| `dataType` | String | 응답 형식 | JSON |
| `base_date` | String | 발표 일자 (YYYYMMDD) | 20260519 |
| `base_time` | String | 발표 시각 (HHMM) | 0500 |
| `nx` | Integer | 격자 X 좌표 | 60 |
| `ny` | Integer | 격자 Y 좌표 | 127 |

> ⚠️ **흔한 실수**: `pageNo`를 `pageN`으로 오타 → 헛 호출 누적!

### 발표 시각 (base_time)

단기예보는 하루 8회 발표:

| 발표 시각 | base_time |
| --- | --- |
| 02:10 | 0200 |
| 05:10 | 0500 |
| 08:10 | 0800 |
| 11:10 | 1100 |
| 14:10 | 1400 |
| 17:10 | 1700 |
| 20:10 | 2000 |
| 23:10 | 2300 |

> 💡 발표 후 **약 10분 뒤부터** 조회 가능
> 💡 현재 시각보다 **이전 발표시각**을 사용해야 함

### 격자 좌표 (nx, ny)

기상청은 위경도가 아닌 **자체 격자 좌표계** 사용

**주요 도시 좌표**

| 도시 | nx | ny |
| --- | --- | --- |
| 서울 | 60 | 127 |
| 부산 | 98 | 76 |
| 인천 | 55 | 124 |
| 대구 | 89 | 90 |
| 광주 | 58 | 74 |
| 대전 | 67 | 100 |
| 울산 | 102 | 84 |
| 제주 | 53 | 38 |

**위경도 → 격자 변환 (Java)**

```java
public static int[] convertGRID_GPS(double lat, double lng) {
    double RE = 6371.00877; // 지구 반경(km)
    double GRID = 5.0;       // 격자 간격(km)
    double SLAT1 = 30.0;
    double SLAT2 = 60.0;
    double OLON = 126.0;
    double OLAT = 38.0;
    double XO = 43;
    double YO = 136;

    double DEGRAD = Math.PI / 180.0;
    double re = RE / GRID;
    double slat1 = SLAT1 * DEGRAD;
    double slat2 = SLAT2 * DEGRAD;
    double olon = OLON * DEGRAD;
    double olat = OLAT * DEGRAD;

    double sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5)
              / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

    double sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;

    double ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    double ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);

    double theta = lng * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    int nx = (int) Math.floor(ra * Math.sin(theta) + XO + 0.5);
    int ny = (int) Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return new int[]{nx, ny};
}
```

### 주요 응답 카테고리

| category | 의미 | 단위 |
| --- | --- | --- |
| TMP | 1시간 기온 | ℃ |
| TMN | 일 최저기온 | ℃ |
| TMX | 일 최고기온 | ℃ |
| REH | 습도 | % |
| WSD | 풍속 | m/s |
| PTY | 강수형태 | 코드 |
| SKY | 하늘상태 | 코드 |
| POP | 강수확률 | % |
| PCP | 1시간 강수량 | mm |
| SNO | 1시간 신적설 | cm |
| UUU | 풍속(동서) | m/s |
| VVV | 풍속(남북) | m/s |
| WAV | 파고 | M |
| VEC | 풍향 | deg |

### 코드 값 정의

**PTY (강수형태)**
| 값 | 의미 |
| --- | --- |
| 0 | 없음 |
| 1 | 비 |
| 2 | 비/눈 |
| 3 | 눈 |
| 4 | 소나기 |

**SKY (하늘상태)**
| 값 | 의미 |
| --- | --- |
| 1 | 맑음 |
| 3 | 구름많음 |
| 4 | 흐림 |

### 응답 예시

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "dataType": "JSON",
      "items": {
        "item": [
          {
            "baseDate": "20260519",
            "baseTime": "0500",
            "category": "TMP",
            "fcstDate": "20260519",
            "fcstTime": "0600",
            "fcstValue": "16",
            "nx": 60,
            "ny": 127
          }
        ]
      },
      "pageNo": 1,
      "numOfRows": 1000,
      "totalCount": 871
    }
  }
}
```

### 호출 예시 (Spring WebClient)

```java
@Service
@RequiredArgsConstructor
public class WeatherApiClient {

    @Value("${weather.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0")
            .build();

    @Cacheable(value = "weather", key = "#nx + '_' + #ny + '_' + #baseDate + '_' + #baseTime")
    public WeatherResponse getVilageFcst(int nx, int ny, String baseDate, String baseTime) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/getVilageFcst")
                        .queryParam("serviceKey", apiKey)
                        .queryParam("pageNo", 1)
                        .queryParam("numOfRows", 1000)
                        .queryParam("dataType", "JSON")
                        .queryParam("base_date", baseDate)
                        .queryParam("base_time", baseTime)
                        .queryParam("nx", nx)
                        .queryParam("ny", ny)
                        .build())
                .retrieve()
                .bodyToMono(WeatherResponse.class)
                .timeout(Duration.ofSeconds(3))
                .retry(2)
                .block();
    }
}
```

---

## 🌡️ 2. 기상청 생활기상지수 조회서비스

### 기본 정보
- **Endpoint**: `http://apis.data.go.kr/1360000/LivingWthrIdxServiceV3`
- 주요 지수:
  - 체감온도지수
  - 자외선지수
  - 더위체감지수
  - 동상가능지수

### 사용 시점
- 위험도 계산 시 체감온도 보강
- 자외선 정보 추가
- 정확한 명세는 활용 시 상세 문서 참고

---

## 🌫️ 3. 에어코리아 대기오염정보

### 기본 정보
- **Endpoint**: `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc`
- **주요 오퍼레이션**:
  - `getMsrstnAcctoRltmMesureDnsty`: 측정소별 실시간 측정
  - `getCtprvnRltmMesureDnsty`: 시도별 실시간 측정

### 필수 파라미터 (시도별 조회)

| 파라미터 | 설명 | 예시 |
| --- | --- | --- |
| `serviceKey` | 인증키 | (환경변수) |
| `returnType` | 형식 | json |
| `sidoName` | 시도명 | 서울 |
| `ver` | 버전 | 1.0 |

### 주요 응답 필드

| 필드 | 의미 |
| --- | --- |
| `pm10Value` | 미세먼지 (μg/m³) |
| `pm10Grade` | 미세먼지 등급 |
| `pm25Value` | 초미세먼지 (μg/m³) |
| `pm25Grade` | 초미세먼지 등급 |
| `o3Value` | 오존 |
| `no2Value` | 이산화질소 |
| `dataTime` | 측정 시각 |

### 등급 기준

**PM10 (미세먼지)**
| 등급 | 농도 (μg/m³) |
| --- | --- |
| 좋음 | 0~30 |
| 보통 | 31~80 |
| 나쁨 | 81~150 |
| 매우 나쁨 | 151+ |

**PM2.5 (초미세먼지)**
| 등급 | 농도 (μg/m³) |
| --- | --- |
| 좋음 | 0~15 |
| 보통 | 16~35 |
| 나쁨 | 36~75 |
| 매우 나쁨 | 76+ |

---

## 🗺️ 4. 카카오 지도 API

카카오는 **두 가지로 나뉩니다**. 키와 호출 위치가 다르니 주의.

### 4-1. 지도 SDK (JavaScript) — 프론트엔드

> 지도 표시, 현재 위치 마커, 산책 경로(Polyline) 그리기

**스크립트 로드** (`index.html` 또는 동적 로드)
```html
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey={JS_KEY}&autoload=false"></script>
```

**기본 지도 표시 (React)**
```jsx
useEffect(() => {
  const script = document.createElement('script')
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false`
  document.head.appendChild(script)
  script.onload = () => {
    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(
        document.getElementById('map'),
        { center: new window.kakao.maps.LatLng(37.5665, 126.978), level: 3 }
      )
    })
  }
}, [])
```

> ⚠️ **플랫폼 등록 필수**: 카카오 개발자 콘솔 → 앱 설정 → 플랫폼 → Web에 `http://localhost:5173` 등록 안 하면 지도가 회색 박스로만 보임.

### 4-2. 로컬 API (REST) — 백엔드

> 주소↔좌표 변환, 공원·장소 키워드 검색

**인증 방식**: HTTP 헤더
```
Authorization: KakaoAK {REST_API_KEY}
```

**주요 엔드포인트**

| 용도 | Endpoint |
| --- | --- |
| 주소 → 좌표 | `https://dapi.kakao.com/v2/local/search/address.json` |
| 좌표 → 주소 | `https://dapi.kakao.com/v2/local/geo/coord2address.json` |
| 키워드 검색 (공원 등) | `https://dapi.kakao.com/v2/local/search/keyword.json` |
| 카테고리 검색 | `https://dapi.kakao.com/v2/local/search/category.json` |

**키워드 검색 파라미터 (공원 찾기)**

| 파라미터 | 설명 | 예시 |
| --- | --- | --- |
| `query` | 검색어 | 공원 |
| `x` | 중심 경도(lng) | 126.978 |
| `y` | 중심 위도(lat) | 37.5665 |
| `radius` | 반경(m, 최대 20000) | 2000 |
| `size` | 결과 수 (최대 15) | 15 |

**호출 예시 (Spring WebClient)**
```java
@Service
@RequiredArgsConstructor
public class KakaoLocalClient {

    @Value("${kakao.rest-api-key}")
    private String restApiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://dapi.kakao.com")
            .build();

    public KakaoSearchResponse searchPlaces(String query, double lat, double lng, int radius) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", query)
                        .queryParam("x", lng)   // 경도
                        .queryParam("y", lat)   // 위도
                        .queryParam("radius", radius)
                        .queryParam("size", 15)
                        .build())
                .header("Authorization", "KakaoAK " + restApiKey)
                .retrieve()
                .bodyToMono(KakaoSearchResponse.class)
                .timeout(Duration.ofSeconds(3))
                .block();
    }
}
```

**응답 주요 필드 (키워드 검색)**

| 필드 | 의미 |
| --- | --- |
| `documents[].place_name` | 장소명 |
| `documents[].address_name` | 지번 주소 |
| `documents[].road_address_name` | 도로명 주소 |
| `documents[].x` | 경도(lng) |
| `documents[].y` | 위도(lat) |
| `documents[].distance` | 중심으로부터 거리(m) |
| `documents[].category_name` | 카테고리 |

> 💡 **x=경도(lng), y=위도(lat)** — 헷갈리기 쉬움! 위경도와 순서 반대.

### 4-3. 카카오 콘솔 설정 체크리스트
- [ ] 앱 생성
- [ ] JavaScript 키 → `VITE_KAKAO_MAP_KEY` (프론트)
- [ ] REST API 키 → `KAKAO_REST_API_KEY` (백엔드)
- [ ] 플랫폼 → Web → `http://localhost:5173` 등록
- [ ] (지도만 쓸 거면 카카오 로그인 활성화 불필요)

---

## 🔐 API 키 관리

### 환경변수 설정

**`application.yml`**
```yaml
weather:
  api:
    key: ${WEATHER_API_KEY}
    base-url: http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0

airquality:
  api:
    key: ${AIRQUALITY_API_KEY}
    base-url: http://apis.data.go.kr/B552584/ArpltnInforInqireSvc

living-weather:
  api:
    key: ${LIVING_WEATHER_API_KEY}
    base-url: http://apis.data.go.kr/1360000/LivingWthrIdxServiceV3

kakao:
  rest-api-key: ${KAKAO_REST_API_KEY}
```

**백엔드 `.env` (Git 제외)**
```
WEATHER_API_KEY=실제키값
AIRQUALITY_API_KEY=실제키값
LIVING_WEATHER_API_KEY=실제키값
KAKAO_REST_API_KEY=실제키값
```

**프론트 `.env` (Git 제외)**
```
VITE_KAKAO_MAP_KEY=실제JS키값
```

**`.gitignore`**
```
.env
.env.local
application-secret.yml
*.key
```

### IntelliJ 환경변수 설정
- Run Configurations → Environment variables
- 또는 `.env` 파일 → EnvFile 플러그인 사용

---

## ⚠️ 사용 시 주의사항

### 1. 호출 한도 관리

- 개발 계정: **1일 1,000회 (API별)**
- 호출 횟수는 **실패 호출도 차감**됨
- 초과 시 다음날 자정 리셋
- 부족하면 **연장 신청** 가능

### 2. 캐싱 필수

```
같은 좌표 + 같은 발표 시각 = 같은 응답
```

| 데이터 | 캐시 TTL | 키 |
| --- | --- | --- |
| 단기예보 | 1시간 | `weather:{nx}:{ny}:{baseDate}:{baseTime}` |
| 미세먼지 | 30분 | `air:{sidoName}` |
| 생활기상지수 | 1시간 | `lwi:{areaNo}:{time}` |

### 3. 에러 처리

| resultCode | 의미 | 대응 |
| --- | --- | --- |
| 00 | 정상 | - |
| 03 | NO_DATA | base_time 확인 |
| 22 | 일일 한도 초과 | 캐시 사용 / 다음날 대기 |
| 30 | 서비스키 미등록 | 키 확인 |
| 31 | 활용기간 만료 | 연장 신청 |

### 4. 응답 시간

- 평균: 200~500ms
- 타임아웃: 3초 권장
- 재시도: 최대 2회

---

## 🧪 작동 테스트 가이드

각 API가 실제로 동작하는지 확인하는 순서입니다. **키 발급 후 제일 먼저** 이걸로 검증하세요.

### ✅ 테스트 체크리스트

- [ ] 기상청 단기예보 — 브라우저 URL 호출 → `resultCode: "00"` 확인
- [ ] 에어코리아 — 브라우저 URL 호출 → `pm10Value` 값 확인
- [ ] 카카오 로컬 — Postman/curl 헤더 인증 → `documents` 배열 확인
- [ ] 카카오 지도 SDK — 로컬 페이지에서 지도 렌더링 확인
- [ ] 받은 응답 JSON을 팀에 공유 (명세서 작성용)

### 1) 기상청 단기예보 — 브라우저로 즉시 테스트
```
http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst
?serviceKey={발급키}
&pageNo=1
&numOfRows=1000
&dataType=JSON
&base_date=20260519
&base_time=0500
&nx=60
&ny=127
```
**성공 판단**: 응답에 `"resultCode": "00"` + `items` 배열에 데이터
**실패 시**:
- `SERVICE_KEY_IS_NOT_REGISTERED` → 키 미등록/오타
- `NO_DATA` → base_time을 현재보다 이전 발표시각으로
- `pageNo` 오타(`pageN`) 주의 — 헛 호출 차감!

### 2) 에어코리아 — 브라우저로 즉시 테스트
```
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty
?serviceKey={발급키}
&returnType=json
&sidoName=서울
&ver=1.0
```
**성공 판단**: `items` 배열에 `pm10Value`, `pm25Value` 값 존재

### 3) 카카오 로컬 API — curl / Postman (헤더 인증)
```bash
curl -G "https://dapi.kakao.com/v2/local/search/keyword.json" \
  -H "Authorization: KakaoAK {REST_API_KEY}" \
  --data-urlencode "query=공원" \
  -d "x=126.978" -d "y=37.5665" -d "radius=2000" -d "size=5"
```
**성공 판단**: `documents` 배열에 장소 목록
**실패 시**: `401` → 헤더 형식 확인 (`KakaoAK ` 뒤 공백 + REST 키)

### 4) 카카오 지도 SDK — 프론트에서 확인
1. `frontend/.env`에 `VITE_KAKAO_MAP_KEY` 설정
2. 카카오 콘솔 → 플랫폼 → Web에 `http://localhost:5173` 등록
3. `npm run dev` → 지도 페이지에서 **지도가 보이면 성공**
4. 회색 박스만 보이면 → 플랫폼 도메인 미등록

### 📎 받은 응답은 꼭 팀에 공유
> 명세서 작성자가 우리 API 응답을 설계하려면 **실제 응답 JSON**이 필요합니다.
> 위 4개 테스트의 응답을 복사해서 `docs/api-samples/` 또는 노션에 첨부하세요.
> Postman 컬렉션(`*.postman_collection.json`)으로 공유하면 더 좋습니다.

---

## 🔗 외부 API → 우리 API 필드 매핑 (명세서 작성자 필독)

외부 데이터가 **우리 백엔드 응답·DB에 어떻게 들어가는지** 정리한 표입니다.
명세서(`06-api-spec.md`)의 `/api/walk/score` 응답 설계 시 이 표를 참고하세요.

### 날씨 → `weather_snapshots` 테이블 / 위험도 계산

| 외부 필드 | 출처 | 우리 컬럼/필드 | 비고 |
| --- | --- | --- | --- |
| `TMP` | 기상청 단기예보 | `temperature` | 1시간 기온 ℃ |
| `REH` | 기상청 단기예보 | `humidity` | 습도 % |
| `WSD` | 기상청 단기예보 | `wind_speed` | 풍속 m/s |
| `PCP` | 기상청 단기예보 | `precipitation` | 강수량 mm |
| `PTY` | 기상청 단기예보 | `weather_condition` | 강수형태 코드 → 문자열 변환 |
| `SKY` | 기상청 단기예보 | `weather_condition` | 하늘상태 코드 → 문자열 변환 |
| `POP` | 기상청 단기예보 | (준비물 추천) | 강수확률 → 우산 안내 |
| 체감온도 | 생활기상지수 | `feels_like` | 체감온도 보강 |
| (계산) | 기온+일사 추정 | `ground_temperature` | 지면온도 = 발바닥 화상 판단 |
| `pm10Value` | 에어코리아 | `pm10` | 미세먼지 |
| `pm25Value` | 에어코리아 | `pm25` | 초미세먼지 |

### 위치 → `walk_routes` 테이블 / 산책로 검색

| 외부 필드 | 출처 | 우리 컬럼/필드 | 비고 |
| --- | --- | --- | --- |
| `documents[].place_name` | 카카오 키워드검색 | `walk_routes.name` | 공원명 등 |
| `documents[].y` | 카카오 | `walk_routes.latitude` | 위도 |
| `documents[].x` | 카카오 | `walk_routes.longitude` | 경도 |
| `road_address_name` | 카카오 | `walk_routes.description` | 주소 |
| (사용자 GPS) | 브라우저 Geolocation | 검색 중심 좌표 | 내 주변 검색 |

> 💡 **명세서 작성자에게**: `/api/walk/score` 응답에는 위 날씨 필드 + 위험도 점수/등급/사유가 들어갑니다. 외부 API 응답을 그대로 노출하지 말고, **우리 필드명으로 가공**해서 응답하세요 (외부 의존성 캡슐화).

---

## 📚 공식 문서

- [공공데이터포털](https://www.data.go.kr/)
- [기상청 단기예보 API](https://www.data.go.kr/data/15084084/openapi.do)
- [에어코리아 API](https://www.data.go.kr/data/15073861/openapi.do)
- [기상청 생활기상지수 API](https://www.data.go.kr/data/15095099/openapi.do)
- [카카오 지도 Web (JavaScript)](https://apis.map.kakao.com/web/)
- [카카오 로컬 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [카카오 개발자 콘솔](https://developers.kakao.com/)

---

## 🔗 관련 문서

- 위험도 계산: [08. 산책 위험도 룰베이스](./08-risk-rules.md)
- 시스템 흐름: [04. 시스템 아키텍처](./04-architecture.md)
