# 09. 외부 API 사용 가이드

본 서비스에서 사용하는 외부 API의 사용법과 주의사항을 정리합니다.

> ⚠️ **보안 주의**: API 키는 절대 GitHub·채팅·문서에 평문으로 노출하지 마세요. 환경변수로만 관리합니다.

---

## 📋 사용 API 목록

| API | 제공처 | 용도 | 한도 |
| --- | --- | --- | --- |
| 단기예보 조회서비스 | 기상청 | 시간별 날씨 예보 | 1,000회/일 (개발) |
| 생활기상지수 조회서비스 | 기상청 | 체감온도·자외선 등 | 1,000회/일 (개발) |
| 에어코리아 대기오염정보 | 한국환경공단 | 미세먼지·초미세먼지 | 1,000회/일 (개발) |

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
```

**`.env` (Git 제외)**
```
WEATHER_API_KEY=실제키값
AIRQUALITY_API_KEY=실제키값
LIVING_WEATHER_API_KEY=실제키값
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

## 🧪 테스트용 샘플 호출

### 브라우저로 즉시 테스트
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

> ⚠️ 위 URL에서 `pageNo`를 절대 `pageN`으로 쓰지 말 것!

### Postman 컬렉션
- `[기상청 API].postman_collection.json` 파일로 팀 공유 권장

---

## 📚 공식 문서

- [공공데이터포털](https://www.data.go.kr/)
- [기상청 단기예보 API](https://www.data.go.kr/data/15084084/openapi.do)
- [에어코리아 API](https://www.data.go.kr/data/15073861/openapi.do)
- [기상청 생활기상지수 API](https://www.data.go.kr/data/15095099/openapi.do)

---

## 🔗 관련 문서

- 위험도 계산: [08. 산책 위험도 룰베이스](./08-risk-rules.md)
- 시스템 흐름: [04. 시스템 아키텍처](./04-architecture.md)
