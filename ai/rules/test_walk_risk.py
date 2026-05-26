"""
산책 위험도 룰베이스 테스트 (10 케이스)
실행:
  - 그냥:   python ai/rules/test_walk_risk.py
  - pytest: pytest ai/rules/test_walk_risk.py
"""

# import 경로 보정 (같은 폴더 실행 / 프로젝트 루트 실행 모두 지원)
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from walk_risk import DogInfo, WeatherInfo, RiskLevel, calculate_walk_risk  # noqa: E402


# --- 견종 프리셋 ---
MALTESE = DogInfo(breed="말티즈", size="소형", coat_type="장모", age_years=1,
                  heat_tolerance=2, cold_tolerance=2)
GOLDEN = DogInfo(breed="골든리트리버", size="대형", coat_type="장모", age_years=4,
                 heat_tolerance=3, cold_tolerance=4)
BULLDOG = DogInfo(breed="불독", size="중형", coat_type="단모", age_years=3,
                  is_brachycephalic=True, heat_tolerance=1, cold_tolerance=2)
SENIOR = DogInfo(breed="시츄", size="소형", coat_type="장모", age_years=12,
                 heat_tolerance=2, cold_tolerance=2)
PUPPY = DogInfo(breed="시바", size="중형", coat_type="단모", age_years=0,
                heat_tolerance=3, cold_tolerance=3)


def test_폭염_말티즈_위험():
    w = WeatherInfo(temperature=32, feels_like=35, humidity=75,
                    ground_temperature=55, pm10=50)
    r = calculate_walk_risk(MALTESE, w)
    assert r.level == RiskLevel.DANGER
    assert r.score < 40


def test_봄저녁_골든리트리버_안전():
    w = WeatherInfo(temperature=20, feels_like=19, humidity=50,
                    ground_temperature=22, pm10=20)
    r = calculate_walk_risk(GOLDEN, w)
    assert r.level == RiskLevel.SAFE
    assert r.score == 100


def test_단두종_더위_위험():
    w = WeatherInfo(temperature=30, feels_like=32, humidity=60,
                    ground_temperature=42, pm10=40)
    r = calculate_walk_risk(BULLDOG, w)
    # 단두종(-25) + 더위약함(-15) + 지면40(-20) + 체감(이하) 등
    assert r.level in (RiskLevel.CAUTION, RiskLevel.DANGER)
    assert any("단두종" in s for s in r.reasons)


def test_미세먼지_나쁨_주의():
    w = WeatherInfo(temperature=18, feels_like=18, humidity=50,
                    ground_temperature=20, pm10=100, pm25=40)
    r = calculate_walk_risk(GOLDEN, w)
    assert any("미세먼지" in s for s in r.reasons)
    assert r.score == 85  # -15


def test_미세먼지_매우나쁨_큰감점():
    w = WeatherInfo(temperature=18, ground_temperature=20, pm10=200, pm25=90)
    r = calculate_walk_risk(GOLDEN, w)
    assert r.score == 70  # -30


def test_한파_소형단모_주의이상():
    cold_dog = DogInfo(breed="치와와", size="소형", coat_type="단모",
                       cold_tolerance=1)
    w = WeatherInfo(temperature=-3, feels_like=-8, ground_temperature=-3)
    r = calculate_walk_risk(cold_dog, w)
    # 체감-5이하(-20) + 추위약함(-15) + 소형단모추위(-10)
    assert r.level in (RiskLevel.CAUTION, RiskLevel.DANGER)


def test_노령견_더위_사유포함():
    w = WeatherInfo(temperature=29, feels_like=30, ground_temperature=40, pm10=40)
    r = calculate_walk_risk(SENIOR, w)
    assert any("노령견" in s and "더위" in s for s in r.reasons)


def test_노령견_추위_사유포함():
    w = WeatherInfo(temperature=-2, feels_like=-2, ground_temperature=-2, pm10=30)
    r = calculate_walk_risk(SENIOR, w)
    assert any("노령견" in s and "추위" in s for s in r.reasons)


def test_노령견_미세먼지_사유포함():
    w = WeatherInfo(temperature=18, ground_temperature=20, pm10=100, pm25=40)
    r = calculate_walk_risk(SENIOR, w)
    assert any("노령견" in s and "미세먼지" in s for s in r.reasons)


def test_퍼피_더위_사유포함():
    w = WeatherInfo(temperature=29, feels_like=28, ground_temperature=26, pm10=30)
    r = calculate_walk_risk(PUPPY, w)
    assert any("어린 강아지" in s and "더위" in s for s in r.reasons)


def test_퍼피_추위_사유포함():
    w = WeatherInfo(temperature=3, feels_like=2, ground_temperature=5, pm10=30)
    r = calculate_walk_risk(PUPPY, w)
    assert any("어린 강아지" in s and "추위" in s for s in r.reasons)


def test_비예보_우산사유():
    w = WeatherInfo(temperature=18, ground_temperature=18, precipitation_type="비")
    r = calculate_walk_risk(GOLDEN, w)
    assert any("우산" in s for s in r.reasons)
    assert r.score == 90  # -10


def test_강풍_감점():
    w = WeatherInfo(temperature=15, ground_temperature=16, wind_speed=12)
    r = calculate_walk_risk(GOLDEN, w)
    assert any("바람" in s for s in r.reasons)
    assert r.score == 90  # -10


def test_완벽한_날씨_사유메시지():
    w = WeatherInfo(temperature=18, feels_like=18, humidity=45,
                    ground_temperature=20, pm10=15, pm25=8, wind_speed=1)
    r = calculate_walk_risk(GOLDEN, w)
    assert r.score == 100
    assert r.level == RiskLevel.SAFE
    assert "좋은 날씨" in r.reasons[0]


# ============================================================
# pytest 없이 직접 실행
# ============================================================
if __name__ == "__main__":
    import sys

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
