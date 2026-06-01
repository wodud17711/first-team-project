"""
체감온도 계산 테스트 (10 케이스)
실행:
  - 그냥:   python ai/weather/test_feels_like.py
  - pytest: pytest ai/weather/test_feels_like.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from feels_like import feels_like  # noqa: E402


# ============================================================
# 여름 — Steadman (기온 ≥ 27°C)
# ============================================================
def test_폭염_고습_체감상승():
    """폭염 + 고습 → 체감 + 3~6°C 정도"""
    # 32°C, 75% RH, 2 m/s — 룰베이스 폭염 시나리오 그대로
    r = feels_like(32, 75, 2)
    assert 33 <= r <= 38, f"got {r}"


def test_매우더움_다습():
    """35°C + 90% RH → 40°C 안팎 (열사병 수준)"""
    r = feels_like(35, 90, 1)
    assert r >= 38, f"got {r}"


def test_여름_저습_바람():
    """30°C + 30% RH + 강풍 3 m/s → 기온 비슷 또는 약간 낮음"""
    r = feels_like(30, 30, 3)
    assert 28 <= r <= 32, f"got {r}"


def test_경계_여름시작_27도():
    """정확히 27°C — Steadman 진입 경계"""
    r = feels_like(27, 50, 2)
    assert 24 <= r <= 30, f"got {r}"


# ============================================================
# 겨울 — Wind Chill (기온 ≤ 10°C AND 풍속 ≥ 1.3 m/s)
# ============================================================
def test_한파_강풍():
    """-3°C + 5 m/s → -8 ~ -10°C 정도"""
    r = feels_like(-3, 40, 5)
    assert -12 <= r <= -6, f"got {r}"


def test_매우추움_강풍():
    """-10°C + 10 m/s → -20°C 이하 (강한 동상 위험)"""
    r = feels_like(-10, 40, 10)
    assert r <= -17, f"got {r}"


def test_경계_겨울시작_10도():
    """10°C + 풍속 1.3 m/s — Wind Chill 진입 경계. 거의 그대로"""
    r = feels_like(10, 50, 1.3)
    assert 7 <= r <= 11, f"got {r}"


# ============================================================
# 봄·가을 또는 무풍 — 기온 그대로
# ============================================================
def test_평년_봄_기온그대로():
    """20°C — 봄/가을 통과 (보정 없음)"""
    r = feels_like(20, 50, 2)
    assert r == 20.0


def test_겨울_무풍_기온그대로():
    """-5°C + 풍속 0 — Wind Chill 조건 미충족이라 기온 그대로"""
    r = feels_like(-5, 50, 0)
    assert r == -5.0


def test_봄저녁_기온그대로():
    """15°C — 봄/가을 통과"""
    r = feels_like(15, 60, 3)
    assert r == 15.0


# ============================================================
# pytest 없이 직접 실행
# ============================================================
if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {t.__name__}  {e}")
        except Exception as e:
            print(f"  ERROR {t.__name__}  {type(e).__name__}: {e}")
    print(f"\n{passed}/{len(tests)} 통과")
    sys.exit(0 if passed == len(tests) else 1)
