"""
ground_temp.py 검증.

샘플 응답 (tools/samples/kma-asos-sample.txt) 을 파싱해서
- 96개 지점 데이터가 모두 정상 파싱되는지
- 주요 도시 위경도 → 가장 가까운 지점 매핑이 맞는지
- 알려진 TS 값 (서울 108 → -2.2℃ 등) 추출 OK
- 결측값 정규화 (-9.0, -99.0 → None) OK
"""

from __future__ import annotations

from pathlib import Path

from ground_temp import (
    AsosRecord,
    get_ground_temp_at,
    get_ground_temp_by_stn,
    nearest_station,
    parse_asos_response,
)

SAMPLE_PATH = Path(__file__).resolve().parent.parent.parent / "tools" / "samples" / "kma-asos-sample.txt"


# 샘플 응답에서 알려진 (stn, ta, ts) — 직접 확인한 값
KNOWN_STATIONS = [
    (108, -6.6, -2.2),    # 서울
    (159,  3.2,  8.2),    # 부산
    (184,  6.3,  7.8),    # 제주
    (143, -1.4,  2.0),    # 대구
    (156,  0.5,  4.4),    # 광주
    (152,  1.2,  3.8),    # 울산
    (105, -0.8,  0.3),    # 강릉
    (101, -6.0, -3.6),    # 춘천
    (133, -3.7, -0.6),    # 대전
    (112, -6.1, -2.1),    # 인천
]


def _check_parse(records: list[AsosRecord]) -> bool:
    print(f"파싱된 레코드 수: {len(records)} (기대: 96)")
    ok = len(records) == 96
    print(f"  → {'OK' if ok else 'FAIL'}")
    return ok


def _check_known_stations(records: list[AsosRecord]) -> bool:
    print()
    print("주요 지점 데이터 확인 (stn, TA, TS):")
    all_ok = True
    for stn, expected_ta, expected_ts in KNOWN_STATIONS:
        r = next((r for r in records if r.stn == stn), None)
        if r is None:
            print(f"  [MISS] stn={stn} 레코드 없음")
            all_ok = False
            continue
        ta_ok = r.ta == expected_ta
        ts_ok = r.ts == expected_ts
        mark = "OK" if ta_ok and ts_ok else "FAIL"
        print(
            f"  [{mark:4s}] stn={stn:3d} TA={r.ta!s:7s} TS={r.ts!s:7s}  "
            f"(기대 TA={expected_ta} TS={expected_ts})"
        )
        if not (ta_ok and ts_ok):
            all_ok = False
    return all_ok


def _check_missing_values(records: list[AsosRecord]) -> bool:
    """결측값(-9.0, -99.0) → None 정규화 확인."""
    print()
    print("결측값 정규화:")
    bad = [
        (r.stn, "ts", r.ts) for r in records
        if r.ts is not None and (r.ts == -9.0 or r.ts == -99.0 or r.ts == -999.0)
    ]
    if bad:
        for stn, col, v in bad:
            print(f"  [FAIL] stn={stn} {col}={v} (None 이어야 함)")
        return False
    print("  → OK (전체 레코드에서 -9.0/-99.0 결측 모두 None 으로 변환)")
    return True


def _check_nearest_station() -> bool:
    print()
    print("위경도 → 가장 가까운 지점:")
    cases = [
        ("서울 시청",  37.5665, 126.9780, 108),
        ("부산 시청",  35.1796, 129.0756, 159),
        ("제주 시청",  33.4996, 126.5312, 184),
        ("대구 시청",  35.8714, 128.6014, 143),
        ("인천 시청",  37.4563, 126.7052, 112),
        ("강릉 시청",  37.7519, 128.8761, 105),
        ("대전 시청",  36.3504, 127.3845, 133),
    ]
    all_ok = True
    for name, lat, lon, expected in cases:
        stn, dist = nearest_station(lat, lon)
        ok = stn == expected
        mark = "OK" if ok else "FAIL"
        print(f"  [{mark:4s}] {name:8s} ({lat:.4f},{lon:.4f}) → stn={stn} dist={dist:.1f}km (기대 {expected})")
        if not ok:
            all_ok = False
    return all_ok


def _check_user_facing_api(records: list[AsosRecord]) -> bool:
    print()
    print("공개 API 통합 검증:")
    seoul_ts = get_ground_temp_at(records, lat=37.5665, lon=126.9780)
    busan_ts = get_ground_temp_at(records, lat=35.1796, lon=129.0756)
    direct_ts = get_ground_temp_by_stn(records, 108)
    overseas = get_ground_temp_at(records, lat=35.6762, lon=139.6503, max_distance_km=100.0)  # 도쿄

    print(f"  get_ground_temp_at(서울) = {seoul_ts} (기대 -2.2)")
    print(f"  get_ground_temp_at(부산) = {busan_ts} (기대 8.2)")
    print(f"  get_ground_temp_by_stn(108) = {direct_ts} (기대 -2.2)")
    print(f"  get_ground_temp_at(도쿄, max 100km) = {overseas} (기대 None)")

    return (
        seoul_ts == -2.2
        and busan_ts == 8.2
        and direct_ts == -2.2
        and overseas is None
    )


def main() -> None:
    print("=" * 60)
    print("KMA Hub ASOS 응답 파싱 + 지면온도 추출 검증")
    print("=" * 60)
    print(f"샘플 파일: {SAMPLE_PATH}")
    print()

    with open(SAMPLE_PATH, encoding="utf-8") as f:
        records = parse_asos_response(f.read())

    results = [
        _check_parse(records),
        _check_known_stations(records),
        _check_missing_values(records),
        _check_nearest_station(),
        _check_user_facing_api(records),
    ]

    print()
    print("=" * 60)
    all_ok = all(results)
    print(f"전체: {'✅ PASS' if all_ok else '❌ FAIL'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
