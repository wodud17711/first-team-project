"""
산책 위험도 룰베이스 v1
========================
날씨 + 반려견 특성을 종합해 산책 위험도(0~100)와 등급(안전/주의/위험), 사유를 산출한다.

설계 원칙
- 프레임워크 의존 없는 순수 Python (백엔드 통합/FastAPI 어느 쪽이든 이식 가능)
- 점수는 100에서 시작해 위험 요인마다 감점 (deduction)
- 모든 룰은 RULES 리스트에 데이터로 정의 → 가중치 튜닝이 쉬움
- ML 모델 도입 전, 설명 가능한 룰베이스로 먼저 서비스

입력 데이터 출처
- 반려견: dog_breeds 테이블 (is_brachycephalic, heat_tolerance, cold_tolerance 등)
- 날씨: 기상청 단기예보 + 에어코리아 (docs/09-external-apis.md 필드 매핑 참고)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Callable


# ============================================================
# 입출력 모델
# ============================================================
class RiskLevel(str, Enum):
    SAFE = "안전"
    CAUTION = "주의"
    DANGER = "위험"


@dataclass
class DogInfo:
    """반려견 정보 (dog + dog_breeds 조인 결과 기준)"""
    breed: str = "믹스"
    size: str = "중형"                 # 소형 / 중형 / 대형
    coat_type: str = "단모"            # 장모 / 단모
    age_years: int = 3
    weight: float = 10.0
    is_brachycephalic: bool = False    # 단두종 (불독·퍼그·시츄 등)
    heat_tolerance: int = 3            # 더위 내성 1(약)~5(강)
    cold_tolerance: int = 3            # 추위 내성 1(약)~5(강)


@dataclass
class WeatherInfo:
    """날씨 스냅샷 (기상청 + 에어코리아)"""
    temperature: float = 20.0          # 기온 ℃ (TMP)
    feels_like: float = 20.0           # 체감온도 ℃ (생활기상지수 or 계산)
    humidity: int = 50                 # 습도 % (REH)
    wind_speed: float = 2.0            # 풍속 m/s (WSD)
    ground_temperature: float = 25.0   # 지면온도 ℃ (추정)
    pm10: int = 30                     # 미세먼지 ㎍/㎥
    pm25: int = 15                     # 초미세먼지 ㎍/㎥
    precipitation_type: str = "없음"   # 없음 / 비 / 비눈 / 눈


@dataclass
class RiskResult:
    score: int
    level: RiskLevel
    reasons: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "level": self.level.value,
            "reasons": self.reasons,
        }


# ============================================================
# 룰 정의
# ============================================================
@dataclass
class Rule:
    code: str                                  # 룰 식별 코드
    penalty: int                               # 감점 (양수)
    predicate: Callable[[DogInfo, WeatherInfo], bool]
    reason: Callable[[DogInfo, WeatherInfo], str]


# --- 룰 목록 (가중치는 여기서 조정) ---
RULES: list[Rule] = [
    # ── 지면온도 (발바닥 화상) ──
    Rule(
        "GROUND_TEMP_SEVERE", 40,
        lambda d, w: w.ground_temperature >= 50,
        lambda d, w: "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
    ),
    Rule(
        "GROUND_TEMP_HIGH", 20,
        lambda d, w: 40 <= w.ground_temperature < 50,
        lambda d, w: "지면이 뜨거워요. 짧은 산책을 권장합니다",
    ),

    # ── 고온 ──
    Rule(
        "FEELS_HOT", 20,
        lambda d, w: w.feels_like >= 33,
        lambda d, w: f"체감온도가 {w.feels_like:.0f}℃로 높습니다",
    ),
    Rule(
        "BRACHY_HEAT", 25,
        lambda d, w: d.is_brachycephalic and w.temperature >= 28,
        lambda d, w: f"단두종({d.breed})은 더운 날 호흡곤란 위험이 있습니다",
    ),
    Rule(
        "LOW_HEAT_TOLERANCE", 15,
        lambda d, w: d.heat_tolerance <= 2 and w.temperature >= 28,
        lambda d, w: f"{d.breed}는 더위에 취약한 견종입니다",
    ),
    Rule(
        "LONG_COAT_HEAT", 10,
        lambda d, w: d.coat_type == "장모" and w.temperature >= 28,
        lambda d, w: "장모종에게 다소 더운 날씨예요",
    ),
    Rule(
        "HUMID_HEAT", 10,
        lambda d, w: w.humidity >= 70 and w.temperature >= 28,
        lambda d, w: "습도가 높아 열사병 위험이 있습니다",
    ),

    # ── 저온 ──
    Rule(
        "FEELS_COLD", 20,
        lambda d, w: w.feels_like <= -5,
        lambda d, w: f"체감온도가 {w.feels_like:.0f}℃로 매우 낮습니다",
    ),
    Rule(
        "LOW_COLD_TOLERANCE", 15,
        lambda d, w: d.cold_tolerance <= 2 and w.temperature <= 0,
        lambda d, w: f"{d.breed}는 추위에 취약한 견종입니다",
    ),
    Rule(
        "SMALL_SHORT_COLD", 10,
        lambda d, w: d.size == "소형" and d.coat_type == "단모" and w.temperature <= 5,
        lambda d, w: "소형 단모종은 추위에 약해요. 옷을 입혀주세요",
    ),

    # ── 미세먼지 ──
    Rule(
        "PM_VERY_BAD", 30,
        lambda d, w: w.pm10 >= 151 or w.pm25 >= 76,
        lambda d, w: "미세먼지가 매우 나쁨 수준입니다",
    ),
    Rule(
        "PM_BAD", 15,
        lambda d, w: (81 <= w.pm10 < 151) or (36 <= w.pm25 < 76),
        lambda d, w: "미세먼지가 나쁨 수준입니다",
    ),

    # ── 강수 ──
    Rule(
        "SNOW", 15,
        lambda d, w: w.precipitation_type in ("눈", "비눈"),
        lambda d, w: "눈이 예보되어 있어요. 미끄럼·동상 주의",
    ),
    Rule(
        "RAIN", 10,
        lambda d, w: w.precipitation_type == "비",
        lambda d, w: "비가 예보되어 있어요. 우산을 챙기세요",
    ),

    # ── 노령견 ──
    Rule(
        "SENIOR_EXTREME", 10,
        lambda d, w: d.age_years >= 8 and (w.temperature >= 28 or w.temperature <= 0),
        lambda d, w: "노령견은 극단적인 날씨에 더 주의가 필요합니다",
    ),

    # ── 강풍 ──
    Rule(
        "STRONG_WIND", 10,
        lambda d, w: w.wind_speed >= 9,
        lambda d, w: f"바람이 강해요(풍속 {w.wind_speed:.0f}m/s)",
    ),
]


# ============================================================
# 점수 → 등급
# ============================================================
def _score_to_level(score: int) -> RiskLevel:
    if score >= 70:
        return RiskLevel.SAFE
    if score >= 40:
        return RiskLevel.CAUTION
    return RiskLevel.DANGER


# ============================================================
# 메인 함수
# ============================================================
def calculate_walk_risk(dog: DogInfo, weather: WeatherInfo) -> RiskResult:
    """반려견 + 날씨로 산책 위험도를 계산한다."""
    score = 100
    reasons: list[str] = []

    for rule in RULES:
        if rule.predicate(dog, weather):
            score -= rule.penalty
            reasons.append(rule.reason(dog, weather))

    score = max(0, min(100, score))  # 0~100 클램프
    level = _score_to_level(score)

    if not reasons:
        reasons.append("산책하기 좋은 날씨예요!")

    return RiskResult(score=score, level=level, reasons=reasons)


# ============================================================
# 간단 실행 데모
# ============================================================
if __name__ == "__main__":
    # 폭염 + 말티즈(장모, 더위 약함)
    dog = DogInfo(breed="말티즈", size="소형", coat_type="장모",
                  age_years=1, heat_tolerance=2)
    weather = WeatherInfo(temperature=32, feels_like=35, humidity=75,
                          ground_temperature=55, pm10=50)
    result = calculate_walk_risk(dog, weather)
    print(f"점수: {result.score} / 등급: {result.level.value}")
    for r in result.reasons:
        print(f"  - {r}")
