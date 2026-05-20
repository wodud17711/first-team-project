# 🤖 AI — 산책 위험도 룰베이스

날씨 + 반려견 특성으로 **산책 위험도(0~100점)·등급(안전/주의/위험)·사유**를 산출하는 룰베이스입니다.

> ML 모델 도입 전, **설명 가능한 룰베이스**로 먼저 서비스합니다.
> 프레임워크 의존이 없어 추후 백엔드 통합 / FastAPI 어느 쪽이든 이식 가능합니다.

## 📁 구조

```
ai/
├─ rules/
│  ├─ walk_risk.py        # 룰베이스 본체 (calculate_walk_risk)
│  └─ test_walk_risk.py   # 테스트 10케이스
└─ notebooks/             # (EDA 노트북 - 추후)
```

## ▶️ 실행

```bash
# 데모 실행
python ai/rules/walk_risk.py

# 테스트 (pytest 없이)
python ai/rules/test_walk_risk.py

# pytest 사용 시
pytest ai/rules/test_walk_risk.py
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
| SENIOR_EXTREME | 8세+ & (기온 ≥ 28 or ≤ 0) | -10 | 노령견 주의 |
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

## 🔗 관련 문서

- 룰 상세: [`docs/08-risk-rules.md`](../docs/08-risk-rules.md)
- 외부 API 필드 매핑: [`docs/09-external-apis.md`](../docs/09-external-apis.md)
- DB (dog_breeds): [`docs/05-database.md`](../docs/05-database.md)
