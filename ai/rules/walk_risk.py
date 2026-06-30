"""
산책 위험도 룰베이스 v1.2
==========================
날씨 + 반려견 특성을 종합해 산책 위험도(0~100)와 등급(안전/주의/위험), 사유를 산출한다.

변경 이력
- v1.4 (2026-06-29): 지면(발바닥 화상) 룰 입력을 'ASOS 측정 맨땅 온도'에서
  '기온+일사(자외선 프록시) 기반 아스팔트 추정 온도'로 전환. 측정 지면(TS)은
  햇볕에 달궈진 아스팔트보다 낮게 읽혀 화상 위험을 과소평가하던 문제 보정
  (예: 기온27℃·UV9 맑음에 측정 지면 37℃ → 추정 아스팔트 ~41℃ → '주의').
  임계(40/50℃)는 그대로 두고 입력만 교정. 측정값이 더 높으면 그 값을 사용(보수적).
- v1.3 (2026-06-04): 치명 요인 등급 강제(override) 추가 — 점수와 무관하게
  지면 화상(≥50℃)·지면 고온(40~50℃)·미세먼지 매우나쁨은 최소 등급을 보장.
  (단일 치명 요인이 감점만으로는 임계(70/40)를 못 넘어 '안전'으로 표기되던 문제 보정)
- v1.2 (2026-05-28): 자외선 룰 UV_HIGH/UV_VERY_HIGH 추가 (생활기상지수 V5 자외선 API)
- v1.1 (2026-05-26): 노령견/퍼피 세분화, 강풍 룰 추가
- v1   (2026-05-22): 초기 16룰

설계 원칙
- 프레임워크 의존 없는 순수 Python (백엔드 통합/FastAPI 어느 쪽이든 이식 가능)
- 점수는 100에서 시작해 위험 요인마다 감점 (deduction)
- 모든 룰은 RULES 리스트에 데이터로 정의 → 가중치 튜닝이 쉬움
- 점수만으로 등급이 위험을 과소평가하는 치명 요인은 LEVEL_OVERRIDES 로 최소 등급 보장
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
    ground_temperature: float = 25.0   # ASOS 측정 지면온도(맨땅 TS) ℃. 발바닥 화상 룰은
                                        # 이 값이 아니라 estimate_asphalt_temp() 추정 노면온도를 쓴다.
    pm10: int = 30                     # 미세먼지 ㎍/㎥
    pm25: int = 15                     # 초미세먼지 ㎍/㎥
    precipitation_type: str = "없음"   # 없음 / 비 / 비눈 / 눈
    uv_index: int = 0                  # 자외선 지수 (생활기상지수 V5, 0~11+)


@dataclass
class RiskResult:
    score: int
    level: RiskLevel
    reasons: list[str] = field(default_factory=list)
    # reasons[i] 와 1:1 대응하는 룰 식별 코드(GROUND_TEMP_SEVERE 등). FE 가 문구 대신
    # 안정적인 코드로 카테고리·아이콘을 매핑할 수 있게 함. 사유 없음(100점)은 ALL_CLEAR.
    reason_codes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "level": self.level.value,
            "reasons": self.reasons,
            "reason_codes": self.reason_codes,
        }


# ============================================================
# 노면(아스팔트) 온도 추정 — 발바닥 화상 룰 입력
# ============================================================
# 발바닥 화상은 개가 실제로 밟는 '햇볕에 달궈진 아스팔트' 온도가 좌우한다.
# 그런데 외부에서 들어오는 ground_temperature 는 ASOS 측정 '맨땅(TS)' 온도라
# 아스팔트보다 낮게 읽혀(잔디·흙 표면) 화상 위험을 과소평가한다.
# 그래서 기온 + 일사량(자외선 프록시)으로 아스팔트 노면온도를 추정해 룰 입력으로 쓴다.
#
# 보정 기준: docs/08-risk-rules.md 지면온도 추정표(맑음/햇볕 노출 시)
#   기온 25℃ → 약 37℃ / 30℃ → 약 50℃ / 35℃ → 약 65℃
# 위 표는 full-sun(자외선 매우높음) 가정. 흐림·강수·야간은 일사계수로 축소한다.

def _sun_factor(weather: "WeatherInfo") -> float:
    """일사량 계수 0~1 (1=쨍쨍한 맑음). 자외선지수를 일사 프록시로 사용하고,
    강수 중에는 노면이 거의 달궈지지 않으므로 강하게 낮춘다."""
    if weather.precipitation_type != "없음":
        return 0.1
    uv = weather.uv_index
    if uv >= 8:
        return 1.0
    if uv >= 6:
        return 0.85
    if uv >= 3:
        return 0.6
    if uv >= 1:
        return 0.3
    return 0.15


def estimate_asphalt_temp(weather: "WeatherInfo") -> float:
    """햇볕에 달궈진 아스팔트 노면온도 추정(℃).

    estimated = 기온 + 일사계수 × 2.0 × max(0, 기온−20)
    → full-sun 기준 기온 25→35 / 30→50 / 35→65 로 docs 추정표와 정합.
    측정 지면값(ground_temperature)이 추정보다 높으면 그 값을 쓴다(보수적, 과소경보 방지).
    """
    gain = 2.0 * max(0.0, weather.temperature - 20.0)
    estimated = weather.temperature + _sun_factor(weather) * gain
    return max(estimated, weather.ground_temperature)


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
        lambda d, w: estimate_asphalt_temp(w) >= 50,
        lambda d, w: "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
    ),
    Rule(
        "GROUND_TEMP_HIGH", 20,
        lambda d, w: 40 <= estimate_asphalt_temp(w) < 50,
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

    # ── 나이 (퍼피 1세 미만 / 노령견 8세 이상) ──
    Rule(
        "PUPPY_EXTREME", 10,
        lambda d, w: d.age_years < 1 and (w.temperature >= 28 or w.temperature <= 5),
        lambda d, w: (
            "어린 강아지는 더위에 약합니다"
            if w.temperature >= 28
            else "어린 강아지는 추위에 약합니다"
        ),
    ),
    Rule(
        "SENIOR_HEAT", 15,
        lambda d, w: d.age_years >= 8 and w.temperature >= 28,
        lambda d, w: "노령견은 더위에 약합니다",
    ),
    Rule(
        "SENIOR_COLD", 15,
        lambda d, w: d.age_years >= 8 and w.temperature <= 0,
        lambda d, w: "노령견은 추위에 약합니다",
    ),
    Rule(
        "SENIOR_BAD_AIR", 10,
        lambda d, w: d.age_years >= 8 and w.pm10 >= 81,
        lambda d, w: "노령견은 미세먼지에 취약합니다",
    ),

    # ── 강풍 ──
    Rule(
        "STRONG_WIND", 10,
        lambda d, w: w.wind_speed >= 9,
        lambda d, w: f"바람이 강해요(풍속 {w.wind_speed:.0f}m/s)",
    ),

    # ── 자외선 (KMA 생활기상지수 V5 표준: 0~2 낮음 / 3~5 보통 / 6~7 높음 / 8~10 매우높음 / 11+ 위험) ──
    Rule(
        "UV_VERY_HIGH", 15,
        lambda d, w: w.uv_index >= 8,
        lambda d, w: f"자외선이 매우 강합니다(지수 {w.uv_index}). 산책 시간을 줄이세요",
    ),
    Rule(
        "UV_HIGH", 8,
        lambda d, w: 6 <= w.uv_index < 8,
        lambda d, w: f"자외선이 강해요(지수 {w.uv_index})",
    ),
]


# ============================================================
# 치명 요인 등급 강제 (override)
# ============================================================
# 점수(감점 누적)만으로는 단일 치명 요인이 임계(70/40)를 못 넘어 '안전'으로
# 표기되는 문제가 있다(예: 미세먼지 매우나쁨 단독 → 70점 '안전', 지면 50℃ 화상
# 단독 → 60점 '주의'). 점수 스케일은 그대로 두고, 아래 요인은 점수와 무관하게
# 최소 등급을 보장한다. 임계/등급은 여기서 조정한다(데이터 누적 후 튜닝 가능).
_LEVEL_SEVERITY = {RiskLevel.SAFE: 0, RiskLevel.CAUTION: 1, RiskLevel.DANGER: 2}


@dataclass
class LevelOverride:
    code: str
    min_level: RiskLevel                       # 이 요인 발생 시 보장할 최소 등급
    predicate: Callable[[DogInfo, WeatherInfo], bool]


# 임계값은 대응 감점 룰과 동일하게 맞춘다(일관성).
LEVEL_OVERRIDES: list[LevelOverride] = [
    # 발바닥 화상(추정 노면 ≥50℃) — 즉각적 부상 위험 → 최소 '위험'
    LevelOverride(
        "GROUND_BURN_DANGER", RiskLevel.DANGER,
        lambda d, w: estimate_asphalt_temp(w) >= 50,
    ),
    # 지면 고온(추정 노면 40~50℃, 짧은 산책 권장) → 최소 '주의'
    LevelOverride(
        "GROUND_HOT_CAUTION", RiskLevel.CAUTION,
        lambda d, w: 40 <= estimate_asphalt_temp(w) < 50,
    ),
    # 미세먼지 매우나쁨(pm10 ≥151 또는 pm25 ≥76) → 최소 '주의'
    LevelOverride(
        "PM_VERY_BAD_CAUTION", RiskLevel.CAUTION,
        lambda d, w: w.pm10 >= 151 or w.pm25 >= 76,
    ),
]


def _apply_level_overrides(level: RiskLevel, dog: DogInfo, weather: WeatherInfo) -> RiskLevel:
    """발화한 override 중 가장 높은 최소 등급으로 등급을 끌어올린다(점수는 불변)."""
    worst = level
    for ov in LEVEL_OVERRIDES:
        if ov.predicate(dog, weather) and _LEVEL_SEVERITY[ov.min_level] > _LEVEL_SEVERITY[worst]:
            worst = ov.min_level
    return worst


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
    reason_codes: list[str] = []

    for rule in RULES:
        if rule.predicate(dog, weather):
            score -= rule.penalty
            reasons.append(rule.reason(dog, weather))
            reason_codes.append(rule.code)

    score = max(0, min(100, score))  # 0~100 클램프
    level = _score_to_level(score)
    level = _apply_level_overrides(level, dog, weather)  # 치명 요인 최소 등급 보장

    if not reasons:
        reasons.append("산책하기 좋은 날씨예요!")
        reason_codes.append("ALL_CLEAR")

    return RiskResult(score=score, level=level, reasons=reasons, reason_codes=reason_codes)


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
