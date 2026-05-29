"""
체감온도 계산 (기상청 공식 단순화)
====================================
- 여름 (기온 ≥ 27°C): Steadman 1979 — 수증기압 기반
- 겨울 (기온 ≤ 10°C AND 풍속 ≥ 1.3 m/s): JAG/TI Wind Chill — 캐나다·미국·KMA 표준
- 그 외 (봄/가을 또는 무풍 겨울): 기온 그대로

출처
- 여름 Steadman: AT = 1.07T + 0.2e - 0.65V - 2.7  (T=°C, e=수증기압 hPa, V=m/s)
- 겨울 JAG/TI: WCT = 13.12 + 0.6215T - 11.37V^0.16 + 0.3965·T·V^0.16  (V=km/h)
- KMA 공식 체감온도 가이드와 ±2°C 이내 정합 목표

사용 (Spring 또는 FastAPI 측에서):
    from ai.weather.feels_like import feels_like
    at = feels_like(temp_c=32, humidity=75, wind_ms=2)  # → 약 35°C
"""

import math


def feels_like(temp_c: float, humidity: int, wind_ms: float) -> float:
    """
    기상청 체감온도 (°C).

    :param temp_c: 기온 (°C). 단기예보 TMP.
    :param humidity: 상대습도 (%, 0~100). 단기예보 REH.
    :param wind_ms: 풍속 (m/s). 단기예보 WSD.
    :return: 체감온도 (°C, 소수 첫째 자리).
    """
    # ---- 여름: Steadman ----
    if temp_c >= 27:
        # 수증기압 e (hPa) — Tetens 공식 변형
        e = (humidity / 100.0) * 6.105 * math.exp(17.27 * temp_c / (237.7 + temp_c))
        at = 1.07 * temp_c + 0.2 * e - 0.65 * wind_ms - 2.7
        return round(at, 1)

    # ---- 겨울: Wind Chill (JAG/TI) ----
    # 풍속 1.3 m/s (≈ 4.7 km/h) 미만이면 의미 없는 보정이라 패스
    if temp_c <= 10 and wind_ms >= 1.3:
        v_kmh = wind_ms * 3.6
        v_pow = v_kmh ** 0.16
        wct = 13.12 + 0.6215 * temp_c - 11.37 * v_pow + 0.3965 * temp_c * v_pow
        return round(wct, 1)

    # ---- 봄·가을, 또는 겨울 무풍: 기온 그대로 ----
    return round(temp_c, 1)


if __name__ == "__main__":
    # 데모
    cases = [
        ("폭염+말티즈 시나리오", 32, 75, 2),
        ("한파 + 강풍", -10, 40, 10),
        ("평년 봄", 20, 50, 2),
        ("매우 더움 + 다습", 35, 90, 1),
        ("겨울 무풍", -5, 50, 0),
    ]
    for name, t, h, w in cases:
        at = feels_like(t, h, w)
        print(f"  {name:>20}  기온 {t:>5}°C / 습도 {h}% / 풍속 {w} m/s  →  체감 {at:>5}°C")
