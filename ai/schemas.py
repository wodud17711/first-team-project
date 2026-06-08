"""
FastAPI 요청·응답 모델 (Pydantic).
walk_risk.py의 dataclass와 분리해 룰베이스 코드를 건드리지 않는다.
"""

from typing import Literal
from pydantic import BaseModel, Field


# ============================================================
# 요청
# ============================================================
class DogIn(BaseModel):
    breed: str = "믹스"
    size: Literal["소형", "중형", "대형"] = "중형"
    coat_type: Literal["장모", "단모"] = "단모"
    age_years: int = Field(default=3, ge=0, le=30)
    weight: float = Field(default=10.0, gt=0, le=100)
    is_brachycephalic: bool = False
    heat_tolerance: int = Field(default=3, ge=1, le=5)
    cold_tolerance: int = Field(default=3, ge=1, le=5)


class WeatherIn(BaseModel):
    temperature: float = Field(default=20.0, ge=-50, le=60)
    feels_like: float = Field(default=20.0, ge=-60, le=70)
    humidity: int = Field(default=50, ge=0, le=100)
    wind_speed: float = Field(default=2.0, ge=0, le=80)
    ground_temperature: float = Field(default=25.0, ge=-50, le=90)
    pm10: int = Field(default=30, ge=0, le=1000)
    pm25: int = Field(default=15, ge=0, le=1000)
    precipitation_type: Literal["없음", "비", "비눈", "눈"] = "없음"
    # 자외선 지수 (생활기상지수 V5, 0~11+). 룰베이스 v1.2 UV_HIGH/UV_VERY_HIGH 입력.
    uv_index: int = Field(default=0, ge=0, le=20)


class ScoreRequest(BaseModel):
    dog: DogIn = Field(default_factory=DogIn)
    weather: WeatherIn = Field(default_factory=WeatherIn)


# ============================================================
# 응답
# ============================================================
class ScoreResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["안전", "주의", "위험"]
    reasons: list[str]
    # reasons[i] 와 1:1 대응하는 룰 식별 코드(GROUND_TEMP_SEVERE 등). FE 가 문구 대신
    # 코드로 카테고리·아이콘을 매핑. 사유 없음(100점)은 ["ALL_CLEAR"].
    reason_codes: list[str]
    # 매칭된 룰 중 감점 큰 순 상위 3개. FE 카드에 '제일 큰 사유'만 보여주고 싶을 때 사용.
    # 모든 룰을 통과해 100점이면 빈 리스트.
    top_reasons: list[str]
    # top_reasons[i] 와 1:1 대응하는 룰 코드.
    top_reason_codes: list[str]
