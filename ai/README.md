# 🤖 AI — 산책 위험도 룰베이스

날씨 + 반려견 특성으로 **산책 위험도(0~100점)·등급(안전/주의/위험)·사유**를 산출하는 룰베이스입니다.

> ML 모델 도입 전, **설명 가능한 룰베이스**로 먼저 서비스합니다.
> 프레임워크 의존이 없어 추후 백엔드 통합 / FastAPI 어느 쪽이든 이식 가능합니다.

## 📁 구조

```
ai/
├─ main.py                # FastAPI 앱 (POST /score, GET /health)
├─ schemas.py             # Pydantic 요청·응답 모델
├─ requirements.txt
├─ rules/
│  ├─ walk_risk.py        # 룰베이스 본체 (calculate_walk_risk)
│  └─ test_walk_risk.py   # 테스트 10케이스
└─ notebooks/             # EDA
```

## ▶️ 실행

### 가상환경 + 의존성 설치 (처음 한 번)
```bash
cd ai
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### FastAPI 서버 (Spring 이 HTTP 로 호출)
```bash
.venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```
- Swagger UI: http://localhost:8000/docs
- 헬스 체크: `GET http://localhost:8000/health` → `{"status":"ok"}`

### 룰베이스 데모 (서버 없이 CLI 한 번 실행)
```bash
.venv/Scripts/python.exe rules/walk_risk.py
```

### 테스트
```bash
.venv/Scripts/python.exe rules/test_walk_risk.py
# pytest 사용 시
pytest rules/test_walk_risk.py
```

## 🧩 사용 예시

```python
from walk_risk import DogInfo, WeatherInfo, calculate_walk_risk

dog = DogInfo(breed="말티즈", size="소형", coat_type="장모",
              age_years=1, heat_tolerance=2)
weather = WeatherInfo(temperature=32, feels_like=35, humidity=75,
                      ground_temperature=55, pm10=50)

result = calculate_walk_risk(dog, weather)
print(result.to_dict())
# {'score': 30, 'level': '위험', 'reasons': [...]}
```

## 📊 룰 가중치 표 (v1)

점수는 **100에서 시작**해 위험 요인마다 감점합니다.

| 코드 | 조건 | 감점 | 사유 |
| --- | --- | --- | --- |
| GROUND_TEMP_SEVERE | 지면온도 ≥ 50℃ | -40 | 발바닥 화상 위험 |
| GROUND_TEMP_HIGH | 지면온도 40~50℃ | -20 | 짧은 산책 권장 |
| FEELS_HOT | 체감온도 ≥ 33℃ | -20 | 고온 |
| BRACHY_HEAT | 단두종 + 기온 ≥ 28℃ | -25 | 호흡곤란 위험 |
| LOW_HEAT_TOLERANCE | 더위내성 ≤ 2 + 기온 ≥ 28℃ | -15 | 더위 취약 견종 |
| LONG_COAT_HEAT | 장모 + 기온 ≥ 28℃ | -10 | 장모종 더위 |
| HUMID_HEAT | 습도 ≥ 70% + 기온 ≥ 28℃ | -10 | 열사병 위험 |
| FEELS_COLD | 체감온도 ≤ -5℃ | -20 | 저온 |
| LOW_COLD_TOLERANCE | 추위내성 ≤ 2 + 기온 ≤ 0℃ | -15 | 추위 취약 견종 |
| SMALL_SHORT_COLD | 소형 + 단모 + 기온 ≤ 5℃ | -10 | 옷 착용 권장 |
| PM_VERY_BAD | PM10 ≥ 151 or PM2.5 ≥ 76 | -30 | 미세먼지 매우 나쁨 |
| PM_BAD | PM10 81~150 or PM2.5 36~75 | -15 | 미세먼지 나쁨 |
| SNOW | 눈/비눈 | -15 | 미끄럼·동상 |
| RAIN | 비 | -10 | 우산 챙기기 |
| PUPPY_EXTREME | 1세 미만 & (기온 ≥ 28 or ≤ 5) | -10 | 어린 강아지 (체온조절 미숙) |
| SENIOR_HEAT | 8세+ & 기온 ≥ 28 | -15 | 노령견 더위 |
| SENIOR_COLD | 8세+ & 기온 ≤ 0 | -15 | 노령견 추위 |
| SENIOR_BAD_AIR | 8세+ & PM10 ≥ 81 | -10 | 노령견 호흡기 |
| STRONG_WIND | 풍속 ≥ 9m/s | -10 | 강풍 |

### 등급 기준
| 점수 | 등급 |
| --- | --- |
| 70~100 | 🟢 안전 |
| 40~69 | 🟡 주의 |
| 0~39 | 🔴 위험 |

> 💡 가중치는 `walk_risk.py`의 `RULES` 리스트에서 한 곳에서 조정합니다.
> 사용자 피드백이 쌓이면 Week 5에 가중치를 재조정(v2)합니다.

## 🔌 입력 데이터 출처

| 입력 | 출처 | 비고 |
| --- | --- | --- |
| 견종 특성 (단두종·내열·내한) | `dog_breeds` 테이블 | Kaggle 시드 데이터 |
| 기온·습도·풍속·강수 | 기상청 단기예보 | `docs/09-external-apis.md` |
| 미세먼지 | 에어코리아 | |
| 지면온도 | 기온 기반 추정 | 추정식 보강 예정 |
| 체감온도 | 생활기상지수 or 계산 | |

## 🛣 향후 계획

| 단계 | 내용 |
| --- | --- |
| **v1 (현재)** | 룰베이스 — 설명 가능, 즉시 서비스 |
| v2 (Week 5) | 사용자 피드백 반영해 가중치 재조정 |
| ML (Phase 2) | 룰베이스 데이터로 학습 → scikit-learn 분류 모델 |
| 견종 이미지 분류 (Phase 2) | Stanford Dogs Dataset + PyTorch |

## 🌐 FastAPI 엔드포인트

### `POST /score`
반려견 + 날씨로 위험도 산출.

**요청** (모든 필드 생략 시 기본값 사용 — Swagger 에서 바로 시험 가능):
```json
{
  "dog": {
    "breed": "말티즈",
    "size": "소형",           // 소형 / 중형 / 대형
    "coat_type": "장모",       // 장모 / 단모
    "age_years": 1,
    "weight": 3.5,
    "is_brachycephalic": false,
    "heat_tolerance": 2,       // 1 (약) ~ 5 (강)
    "cold_tolerance": 3
  },
  "weather": {
    "temperature": 32.0,
    "feels_like": 35.0,
    "humidity": 75,
    "wind_speed": 2.0,
    "ground_temperature": 55.0,
    "pm10": 50,
    "pm25": 30,
    "precipitation_type": "없음"  // 없음 / 비 / 비눈 / 눈
  }
}
```

**응답**:
```json
{
  "score": 5,
  "level": "위험",             // 안전 / 주의 / 위험
  "reasons": [                  // 매칭된 모든 룰 (룰 순서)
    "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
    "체감온도가 35℃로 높습니다",
    "말티즈는 더위에 취약한 견종입니다",
    "장모종에게 다소 더운 날씨예요",
    "습도가 높아 열사병 위험이 있습니다"
  ],
  "top_reasons": [              // 감점 큰 순 상위 3개 (FE 카드용)
    "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
    "체감온도가 35℃로 높습니다",
    "말티즈는 더위에 취약한 견종입니다"
  ]
}
```

- 모든 룰 통과 (100점) 시 `reasons` 에 `"산책하기 좋은 날씨예요!"`, `top_reasons` 는 `[]`
- 입력 검증 실패 시 HTTP 422 + Pydantic 메시지

### `GET /health`
헬스 체크. `{"status":"ok"}` 반환.

---

## ☕ Spring 호출 샘플 (Week 3 BE 참고)

Spring Boot 4.0.6 의 `RestClient` 사용 예시. 위험도 호출이 실패하면 표준 에러 코드 `AI_SERVER_ERROR` 로 던집니다.

```java
// backend/src/main/java/com/example/demo/walk/client/AiClient.java
package com.example.demo.walk.client;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Component
public class AiClient {

    private final RestClient client;

    public AiClient(@Value("${ai.base-url:http://localhost:8000}") String baseUrl) {
        this.client = RestClient.builder().baseUrl(baseUrl).build();
    }

    public ScoreResponse score(DogInfo dog, WeatherInfo weather) {
        try {
            return client.post()
                    .uri("/score")
                    .body(new ScoreRequest(dog, weather))
                    .retrieve()
                    .body(ScoreResponse.class);
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.AI_SERVER_ERROR);
        }
    }

    // ---- DTO (snake_case ↔ camelCase 매핑) ----
    public record ScoreRequest(DogInfo dog, WeatherInfo weather) {}

    public record DogInfo(
            String breed,
            String size,                                          // "소형" / "중형" / "대형"
            @JsonProperty("coat_type") String coatType,           // "장모" / "단모"
            @JsonProperty("age_years") int ageYears,
            double weight,
            @JsonProperty("is_brachycephalic") boolean isBrachycephalic,
            @JsonProperty("heat_tolerance") int heatTolerance,
            @JsonProperty("cold_tolerance") int coldTolerance
    ) {}

    public record WeatherInfo(
            double temperature,
            @JsonProperty("feels_like") double feelsLike,
            int humidity,
            @JsonProperty("wind_speed") double windSpeed,
            @JsonProperty("ground_temperature") double groundTemperature,
            int pm10,
            int pm25,
            @JsonProperty("precipitation_type") String precipitationType
    ) {}

    public record ScoreResponse(
            int score,
            String level,
            List<String> reasons,
            @JsonProperty("top_reasons") List<String> topReasons
    ) {}
}
```

`application.properties` 에 호출 대상 추가:
```properties
# AI 서버 (FastAPI)
ai.base-url=http://localhost:8000
```

**호출 예시**:
```java
@Service
@RequiredArgsConstructor
public class WalkScoreService {
    private final AiClient aiClient;
    private final DogRepository dogRepository;

    public AiClient.ScoreResponse calculate(Long dogId, WeatherSnapshot snapshot) {
        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));

        var dogInfo = new AiClient.DogInfo(
                dog.getBreed().getNameKr(),
                dog.getBreed().getSize(),
                dog.getBreed().getCoatType(),
                /* ageYears */ Period.between(dog.getBirthDate(), LocalDate.now()).getYears(),
                dog.getWeight().doubleValue(),
                dog.getBreed().isBrachycephalic(),
                dog.getBreed().getHeatTolerance(),
                dog.getBreed().getColdTolerance()
        );
        var weatherInfo = new AiClient.WeatherInfo(
                snapshot.getTemperature(), snapshot.getFeelsLike(), snapshot.getHumidity(),
                snapshot.getWindSpeed(), snapshot.getGroundTemperature(),
                snapshot.getPm10(), snapshot.getPm25(), snapshot.getPrecipitationType()
        );
        return aiClient.score(dogInfo, weatherInfo);
    }
}
```

> 💡 BE 입장에서 `top_reasons` 만 받아 FE 점수 카드에 노출하면 됩니다.
> 전체 `reasons` 는 통계·로깅·디버깅에 유용.

---

## 🔗 관련 문서

- 룰 상세: [`docs/08-risk-rules.md`](../docs/08-risk-rules.md)
- 외부 API 필드 매핑: [`docs/09-external-apis.md`](../docs/09-external-apis.md)
- DB (dog_breeds): [`docs/05-database.md`](../docs/05-database.md)
