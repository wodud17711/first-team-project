"""
산책 위험도 점수 서비스 (FastAPI).
- POST /score  : 반려견 + 날씨 → 점수·등급·사유
- GET  /health : 헬스체크

실행:
    cd ai
    uvicorn main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
"""

from fastapi import FastAPI

from rules.walk_risk import RULES, DogInfo, WeatherInfo, calculate_walk_risk
from schemas import ScoreRequest, ScoreResponse


def _top_reasons(dog: DogInfo, weather: WeatherInfo, n: int = 3) -> list[str]:
    """매칭된 룰을 감점 큰 순으로 정렬해 상위 n개 사유만 반환 (FE 카드용)."""
    matched = [(r.reason(dog, weather), r.penalty) for r in RULES if r.predicate(dog, weather)]
    return [reason for reason, _ in sorted(matched, key=lambda x: -x[1])[:n]]


app = FastAPI(
    title="댕기온 산책 위험도 API",
    description="날씨 + 반려견 특성으로 산책 위험도(0~100)·등급·사유를 산출합니다.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    dog = DogInfo(**req.dog.model_dump())
    weather = WeatherInfo(**req.weather.model_dump())
    result = calculate_walk_risk(dog, weather)
    return ScoreResponse(
        score=result.score,
        level=result.level.value,
        reasons=result.reasons,
        top_reasons=_top_reasons(dog, weather),
    )
