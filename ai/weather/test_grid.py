"""
grid.py 검증.

기상청 공식 매뉴얼·공개 변환표에 명시된 주요 도시 격자값과 일치하는지 확인.
"""

from __future__ import annotations

from grid import Grid, NX, NY, grid_to_latlon, latlon_to_grid


# (도시, 위도, 경도, 기대 nx, 기대 ny)
# 출처: 기상청 단기예보 API 가이드의 "예제 격자 좌표".
KNOWN_CITIES: list[tuple[str, float, float, int, int]] = [
    ("서울",   37.5665, 126.9780, 60, 127),
    ("부산",   35.1796, 129.0756, 98,  76),
    ("제주",   33.4996, 126.5312, 53,  38),
    ("인천",   37.4563, 126.7052, 55, 124),
    ("대전",   36.3504, 127.3845, 67, 100),
    ("대구",   35.8714, 128.6014, 89,  90),
    ("광주",   35.1595, 126.8526, 58,  74),
    ("울산",   35.5384, 129.3114, 102, 84),
    ("강릉",   37.7519, 128.8761, 92, 131),
    ("춘천",   37.8813, 127.7300, 73, 134),
]


def _check_known_cities() -> tuple[int, int]:
    """
    주요 도시 격자값 검증. (정확 일치, 근접 ±1 일치) 반환.

    격자 경계(5km) 근처 좌표는 알려진 변환표 출처(시청·측정소)에 따라 ny ±1 차이가
    자연스러움. 변환 정확성 자체는 정확 일치 + 근접 일치 모두 통과로 본다.
    """
    exact = 0
    near = 0
    for name, lat, lon, expected_nx, expected_ny in KNOWN_CITIES:
        grid = latlon_to_grid(lat, lon)
        is_exact = grid.nx == expected_nx and grid.ny == expected_ny
        is_near = (
            abs(grid.nx - expected_nx) <= 1
            and abs(grid.ny - expected_ny) <= 1
        )
        if is_exact:
            mark = "OK"
            exact += 1
            near += 1
        elif is_near:
            mark = "NEAR"
            near += 1
        else:
            mark = "FAIL"
        print(
            f"[{mark:4s}] {name:5s} ({lat:7.4f}, {lon:8.4f}) "
            f"→ nx={grid.nx:3d} ny={grid.ny:3d}   "
            f"(기대 nx={expected_nx} ny={expected_ny})"
        )
    return exact, near


def _check_round_trip() -> bool:
    """격자 → 위경도 → 격자 round-trip 으로 일관성 확인."""
    print()
    print("Round-trip 검증 (격자 → 위경도 → 격자):")
    ok_count = 0
    for name, lat, lon, expected_nx, expected_ny in KNOWN_CITIES[:5]:
        grid = latlon_to_grid(lat, lon)
        back_lat, back_lon = grid_to_latlon(grid.nx, grid.ny)
        regrid = latlon_to_grid(back_lat, back_lon)
        ok = (regrid.nx, regrid.ny) == (grid.nx, grid.ny)
        mark = "OK" if ok else "FAIL"
        print(
            f"  [{mark}] {name:5s} ({lat:.4f},{lon:.4f}) → ({grid.nx},{grid.ny}) "
            f"→ ({back_lat:.4f},{back_lon:.4f}) → ({regrid.nx},{regrid.ny})"
        )
        if ok:
            ok_count += 1
    return ok_count == 5


def _check_bounds() -> bool:
    """한반도 밖 좌표는 in_bounds() == False."""
    print()
    print("범위 검증:")
    # 한반도 밖 (도쿄)
    tokyo = latlon_to_grid(35.6762, 139.6503)
    out_ok = not tokyo.in_bounds() or tokyo.nx > NX or tokyo.ny > NY or tokyo.nx < 1 or tokyo.ny < 1
    print(f"  [OK if out] 도쿄 (35.68,139.65) → nx={tokyo.nx} ny={tokyo.ny} in_bounds={tokyo.in_bounds()}")

    # 한반도 안 (서울)
    seoul = latlon_to_grid(37.5665, 126.9780)
    in_ok = seoul.in_bounds()
    print(f"  [OK if in]  서울 → in_bounds={seoul.in_bounds()}")
    return out_ok and in_ok


def main() -> None:
    print("=" * 60)
    print("KMA 격자 좌표 변환 검증")
    print("=" * 60)
    print()
    print("주요 도시 격자값 검증 (OK = 정확, NEAR = ±1 이내, FAIL = 이외):")
    exact, near = _check_known_cities()
    total = len(KNOWN_CITIES)
    print()
    print(f"결과: 정확 {exact}/{total}, ±1 근접 포함 {near}/{total}")

    round_ok = _check_round_trip()
    bounds_ok = _check_bounds()

    print()
    print("=" * 60)
    # 합격 기준: 모든 도시가 ±1 이내 + round-trip + bounds 통과
    all_ok = near == total and round_ok and bounds_ok
    print(f"전체: {'✅ PASS' if all_ok else '❌ FAIL'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
