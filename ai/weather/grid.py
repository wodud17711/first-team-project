"""
KMA 격자 좌표 변환 (Lambert Conformal Conic).

기상청 단기예보 API 는 위·경도가 아니라 격자 (nx, ny) 를 받는다.
사용자가 보낸 위경도를 격자로 변환해서 API 호출에 쓰고,
캐시 키도 격자 단위로 만들면 인접 호출이 같은 키를 공유 → 호출 횟수 절감.

격자 간격: 5km. 한반도 전체를 (nx 1~149, ny 1~253) 로 덮음.

공식 출처: 기상청 단기예보 API 활용 가이드 (data.go.kr / apihub.kma.go.kr 공통).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# ============================================================
# KMA LCC DFS 좌표 변환 상수 (기상청 공식)
# ============================================================
NX = 149
NY = 253
RE = 6371.00877      # 지구 반경 (km)
GRID = 5.0           # 격자 간격 (km)
SLAT1 = 30.0         # 표준 위도 1
SLAT2 = 60.0         # 표준 위도 2
OLON = 126.0         # 기준점 경도
OLAT = 38.0          # 기준점 위도
XO = 43              # 기준점 X 격자
YO = 136             # 기준점 Y 격자

_DEGRAD = math.pi / 180.0
_RADDEG = 180.0 / math.pi


# ============================================================
# 미리 계산해 두는 투영 상수 (모듈 로드 시 1회)
# ============================================================
def _projection_constants() -> tuple[float, float, float]:
    re = RE / GRID
    slat1_r = SLAT1 * _DEGRAD
    slat2_r = SLAT2 * _DEGRAD
    olat_r = OLAT * _DEGRAD

    sn = (
        math.tan(math.pi * 0.25 + slat2_r * 0.5)
        / math.tan(math.pi * 0.25 + slat1_r * 0.5)
    )
    sn = math.log(math.cos(slat1_r) / math.cos(slat2_r)) / math.log(sn)

    sf = math.tan(math.pi * 0.25 + slat1_r * 0.5)
    sf = (sf ** sn) * math.cos(slat1_r) / sn

    ro = math.tan(math.pi * 0.25 + olat_r * 0.5)
    ro = re * sf / (ro ** sn)

    return sn, sf, ro


_SN, _SF, _RO = _projection_constants()
_RE_SCALED = RE / GRID


# ============================================================
# 공개 API
# ============================================================
@dataclass(frozen=True)
class Grid:
    """KMA 격자 좌표."""
    nx: int
    ny: int

    def in_bounds(self) -> bool:
        return 1 <= self.nx <= NX and 1 <= self.ny <= NY


def latlon_to_grid(lat: float, lon: float) -> Grid:
    """
    위·경도 (도 단위) → KMA 격자 (nx, ny).

    Args:
        lat: 위도 (예: 서울 37.5665)
        lon: 경도 (예: 서울 126.9780)

    Returns:
        Grid(nx, ny). 한반도 범위 밖이면 in_bounds() == False.

    Examples:
        >>> g = latlon_to_grid(37.5665, 126.9780)
        >>> (g.nx, g.ny)
        (60, 127)
    """
    ra = math.tan(math.pi * 0.25 + lat * _DEGRAD * 0.5)
    ra = _RE_SCALED * _SF / (ra ** _SN)

    theta = lon * _DEGRAD - OLON * _DEGRAD
    if theta > math.pi:
        theta -= 2.0 * math.pi
    if theta < -math.pi:
        theta += 2.0 * math.pi
    theta *= _SN

    nx = int(ra * math.sin(theta) + XO + 0.5)
    ny = int(_RO - ra * math.cos(theta) + YO + 0.5)
    return Grid(nx=nx, ny=ny)


def grid_to_latlon(nx: int, ny: int) -> tuple[float, float]:
    """
    KMA 격자 (nx, ny) → 위·경도 (도 단위).

    캐시 키 디버깅이나 격자 중심 좌표 확인용. 산책 위험도 계산엔 보통 쓰지 않음.

    Args:
        nx, ny: 격자 좌표

    Returns:
        (lat, lon) 튜플

    Examples:
        >>> lat, lon = grid_to_latlon(60, 127)
        >>> round(lat, 2), round(lon, 2)
        (37.58, 126.97)
    """
    xn = nx - XO
    yn = _RO - (ny - YO)
    ra = math.sqrt(xn * xn + yn * yn)
    if _SN < 0.0:
        ra = -ra

    alat = (_RE_SCALED * _SF / ra) ** (1.0 / _SN)
    alat = 2.0 * math.atan(alat) - math.pi * 0.5

    if abs(xn) <= 0.0:
        theta = 0.0
    else:
        if abs(yn) <= 0.0:
            theta = math.pi * 0.5
            if xn < 0.0:
                theta = -theta
        else:
            theta = math.atan2(xn, yn)

    alon = theta / _SN + OLON * _DEGRAD
    return alat * _RADDEG, alon * _RADDEG
