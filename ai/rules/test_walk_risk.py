"""
산책 위험도 룰베이스 테스트 (24 케이스)
- 점수/등급/사유 문장 (17): 폭염·한파·미세먼지·자외선·노령견·퍼피·강풍·강수 등
- reason_codes (#70, 7): 코드↔문장 1:1 정합, 레지스트리 유효성, 특정 코드 발화, ALL_CLEAR
실행:
  - 그냥:   python ai/rules/test_walk_risk.py
  - pytest: pytest ai/rules/test_walk_risk.py
"""

# import 경로 보정 (같은 폴더 실행 / 프로젝트 루트 실행 모두 지원)
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from walk_risk import (  # noqa: E402
    DogInfo, WeatherInfo, RiskLevel, calculate_walk_risk, RULES,
    estimate_asphalt_temp,
)

# 룰 레지스트리의 모든 코드 + 사유 없음 폴백. reason_codes 유효성 검증용.
# (동적 code 룰은 all_codes() 로 낼 수 있는 코드 전체를 노출한다 — v1.5)
VALID_CODES = {c for r in RULES for c in r.all_codes()} | {"ALL_CLEAR"}


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


def test_자외선_매우높음_감점():
    w = WeatherInfo(temperature=22, feels_like=22, humidity=50,
                    ground_temperature=24, pm10=20, uv_index=10)
    r = calculate_walk_risk(GOLDEN, w)
    assert any("자외선" in s and "매우" in s for s in r.reasons)
    assert r.score == 85  # -15


def test_자외선_높음_감점():
    w = WeatherInfo(temperature=22, feels_like=22, humidity=50,
                    ground_temperature=24, pm10=20, uv_index=7)
    r = calculate_walk_risk(GOLDEN, w)
    assert any("자외선이 강해요" in s for s in r.reasons)
    assert r.score == 92  # -8


def test_자외선_보통_미감점():
    w = WeatherInfo(temperature=22, feels_like=22, humidity=50,
                    ground_temperature=24, pm10=20, uv_index=5)
    r = calculate_walk_risk(GOLDEN, w)
    assert all("자외선" not in s for s in r.reasons)
    assert r.score == 100


def test_완벽한_날씨_사유메시지():
    w = WeatherInfo(temperature=18, feels_like=18, humidity=45,
                    ground_temperature=20, pm10=15, pm25=8, wind_speed=1)
    r = calculate_walk_risk(GOLDEN, w)
    assert r.score == 100
    assert r.level == RiskLevel.SAFE
    assert "좋은 날씨" in r.reasons[0]


# ============================================================
# reason_codes 검증 (#70 — FE 위험사유 매핑의 정본)
# ============================================================
def test_reason_codes_1대1_정합():
    # 여러 시나리오에서 reasons(문장)와 reason_codes(코드)가 길이·인덱스 1:1
    scenarios = [
        (MALTESE, WeatherInfo(temperature=32, feels_like=35, humidity=75,
                              ground_temperature=55, pm10=50)),
        (BULLDOG, WeatherInfo(temperature=30, feels_like=32, ground_temperature=42,
                              pm10=200, pm25=90, uv_index=10)),
        (GOLDEN, WeatherInfo(temperature=18, feels_like=18, humidity=45,
                             ground_temperature=20, pm10=15)),  # 사유 없음
    ]
    for dog, w in scenarios:
        r = calculate_walk_risk(dog, w)
        assert len(r.reasons) == len(r.reason_codes), (dog.breed, r.reasons, r.reason_codes)
        assert len(r.reason_codes) >= 1


def test_reason_codes_레지스트리_유효():
    # 출력되는 모든 코드는 RULES 레지스트리(또는 ALL_CLEAR)에 존재해야 함
    r = calculate_walk_risk(BULLDOG, WeatherInfo(temperature=30, feels_like=32,
                            ground_temperature=42, pm10=200, pm25=90, uv_index=10))
    for c in r.reason_codes:
        assert c in VALID_CODES, c


def test_reason_code_지면화상_SEVERE():
    r = calculate_walk_risk(GOLDEN, WeatherInfo(temperature=20, ground_temperature=55))
    assert "GROUND_TEMP_SEVERE" in r.reason_codes


def test_reason_code_미세먼지_매우나쁨():
    r = calculate_walk_risk(GOLDEN, WeatherInfo(temperature=18, ground_temperature=20,
                            pm10=200, pm25=90))
    assert "PM_VERY_BAD" in r.reason_codes


def test_reason_code_단두종_더위():
    r = calculate_walk_risk(BULLDOG, WeatherInfo(temperature=30, ground_temperature=25))
    assert "BRACHY_HEAT" in r.reason_codes


def test_reason_code_자외선_매우높음():
    r = calculate_walk_risk(GOLDEN, WeatherInfo(temperature=22, feels_like=22,
                            ground_temperature=24, uv_index=10))
    assert "UV_VERY_HIGH" in r.reason_codes


def test_reason_code_완벽한날씨_ALL_CLEAR():
    r = calculate_walk_risk(GOLDEN, WeatherInfo(temperature=18, feels_like=18,
                            humidity=45, ground_temperature=20, pm10=15, pm25=8,
                            wind_speed=1))
    assert r.reason_codes == ["ALL_CLEAR"]
    assert len(r.reasons) == 1


# ============================================================
# 노면 추정 전환 (v1.4 — 발바닥 화상 입력을 측정 맨땅→추정 아스팔트로)
# ============================================================
def test_노면추정_docs표_정합():
    # full-sun(자외선 매우높음) 기준 docs 추정표: 25→35 / 30→50 / 35→65
    def est(t):
        return estimate_asphalt_temp(
            WeatherInfo(temperature=t, uv_index=10, ground_temperature=0))
    assert est(25) == 35
    assert est(30) == 50
    assert est(35) == 65


def test_맑은날_측정지면낮아도_추정노면으로_주의():
    # 실제 운영 케이스: 기온27·UV9 맑음 + 측정 지면 37℃(맨땅이라 낮음)
    # → 추정 아스팔트 41℃ → GROUND_TEMP_HIGH 발화, 등급 '주의'
    w = WeatherInfo(temperature=27, feels_like=27, humidity=65,
                    ground_temperature=37, pm10=20, uv_index=9)
    r = calculate_walk_risk(GOLDEN, w)
    assert "GROUND_TEMP_HIGH" in r.reason_codes
    assert r.level == RiskLevel.CAUTION
    # v1.5 연속 램프: 추정 노면 41℃ → 지면 감점 -22(=20+(41-40)/10*20), 자외선 매우높음 -15
    assert r.score == 63


def test_흐린날_같은기온_추정노면_미발화():
    # 같은 기온이라도 자외선 낮으면(흐림) 노면이 안 달궈져 과잉 경보하지 않음
    w = WeatherInfo(temperature=27, feels_like=27, humidity=65,
                    ground_temperature=27, pm10=20, uv_index=2)
    r = calculate_walk_risk(GOLDEN, w)
    assert "GROUND_TEMP_HIGH" not in r.reason_codes
    assert "GROUND_TEMP_SEVERE" not in r.reason_codes
    assert r.score == 100


def test_비오는날_추정노면_미발화():
    # 강수 중에는 노면이 달궈지지 않으므로 지면 룰 미발화
    w = WeatherInfo(temperature=30, ground_temperature=30,
                    precipitation_type="비", uv_index=0)
    r = calculate_walk_risk(GOLDEN, w)
    assert "GROUND_TEMP_HIGH" not in r.reason_codes
    assert "GROUND_TEMP_SEVERE" not in r.reason_codes


# ============================================================
# v1.5 — 하드 임계 절벽 완화 (지면·체감·미세먼지 연속화)
# ============================================================
def _ground_only(asphalt):
    """temp18·uv0 이면 추정 노면이 낮아 asphalt=측정 지면값 → 지면 감점만 격리."""
    return WeatherInfo(temperature=18, feels_like=18, humidity=50,
                       ground_temperature=asphalt, pm10=30, pm25=15, uv_index=0)


def test_v15_지면_앵커_보존():
    # 40℃→-20, 50℃→-40 (기존 튜닝값 유지)
    assert calculate_walk_risk(GOLDEN, _ground_only(40)).score == 80
    assert calculate_walk_risk(GOLDEN, _ground_only(50)).score == 60


def test_v15_지면_임계40_절벽제거():
    lo = calculate_walk_risk(GOLDEN, _ground_only(39.9)).score
    hi = calculate_walk_risk(GOLDEN, _ground_only(40.1)).score
    assert abs(lo - hi) <= 2  # 예전엔 0.2℃ 차이로 20점 절벽


def test_v15_지면_임계50_절벽제거():
    lo = calculate_walk_risk(GOLDEN, _ground_only(49.9)).score
    hi = calculate_walk_risk(GOLDEN, _ground_only(50.1)).score
    assert abs(lo - hi) <= 2


def test_v15_지면_단조감소():
    prev = 101
    for a in [36, 38, 40, 42, 45, 48, 50, 52, 55]:
        s = calculate_walk_risk(GOLDEN, _ground_only(a)).score
        assert s <= prev, (a, s, prev)
        prev = s


def test_v15_체감_임계33_절벽제거():
    def w(f):
        return WeatherInfo(temperature=19, feels_like=f, humidity=50,
                           ground_temperature=20, pm10=30, uv_index=0)
    lo = calculate_walk_risk(GOLDEN, w(32.9)).score
    hi = calculate_walk_risk(GOLDEN, w(33.1)).score
    assert abs(lo - hi) <= 2


def test_v15_체감_앵커_보존():
    # 체감 33℃ → -20 (기존 값 유지)
    w = WeatherInfo(temperature=19, feels_like=33, humidity=50,
                    ground_temperature=20, pm10=30, uv_index=0)
    assert calculate_walk_risk(GOLDEN, w).score == 80


def test_v15_미세먼지_경계81_절벽제거():
    def w(pm):
        return WeatherInfo(temperature=18, feels_like=18,
                           ground_temperature=20, pm10=pm, pm25=10, uv_index=0)
    lo = calculate_walk_risk(GOLDEN, w(80)).score
    hi = calculate_walk_risk(GOLDEN, w(82)).score
    assert abs(lo - hi) <= 5  # 예전엔 81에서 -15 절벽


def test_v15_미세먼지_존감점_유지():
    # 나쁨 평탄대(-15) / 매우나쁨(-30) 값 보존
    def w(pm):
        return WeatherInfo(temperature=18, feels_like=18,
                           ground_temperature=20, pm10=pm, pm25=10, uv_index=0)
    assert calculate_walk_risk(GOLDEN, w(120)).score == 85   # 나쁨 평탄 -15
    assert calculate_walk_risk(GOLDEN, w(200)).score == 70   # 매우나쁨 -30


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
