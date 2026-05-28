"""
KMA Hub ASOS 시간자료 (kma_sfctm3) 응답 파싱 + 지면온도(TS) 추출.

응답 형식
- 텍스트 (공백 구분, 고정 너비 비슷).
- `#START7777` ~ `#7777END` 마커 사이.
- `#` 으로 시작하는 줄은 헤더/주석 (무시).
- 각 데이터 줄 = 한 지점 × 한 시각의 46개 컬럼.

핵심 컬럼 (0-base 인덱스)
- 0  : TM (관측시각, YYYYMMDDHHMI)
- 1  : STN (지점번호)
- 11 : TA (기온, ℃)
- 13 : HM (상대습도, %)
- 36 : TS (지면온도, ℃)  ← 우리가 필요한 것

결측값
- 정수형 컬럼: -9
- 실수형 컬럼: -9.0 또는 -99.0
→ 모두 None 으로 정규화.

사용 예
    >>> with open('tools/samples/kma-asos-sample.txt', encoding='utf-8') as f:
    ...     records = parse_asos_response(f.read())
    >>> get_ground_temp_at(records, lat=37.5665, lon=126.9780)  # 서울
    -2.2
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# ============================================================
# 컬럼 인덱스 (0-base, 응답 헤더 순서와 일치)
# ============================================================
COL_TM = 0
COL_STN = 1
COL_TA = 11
COL_HM = 13
COL_TS = 36
MIN_COLUMN_COUNT = 37  # TS 까지 있어야 정상 데이터

# ============================================================
# 결측값 — KMA 표기는 -9, -9.0, -99.0
# ============================================================
_MISSING_FLOAT = {-9.0, -99.0, -999.0}


def _parse_float(token: str) -> float | None:
    """결측값(-9.0, -99.0 등)은 None 으로 정규화."""
    try:
        v = float(token)
    except ValueError:
        return None
    if v in _MISSING_FLOAT:
        return None
    return v


# ============================================================
# 데이터 모델
# ============================================================
@dataclass(frozen=True)
class AsosRecord:
    """한 지점 × 한 시각의 ASOS 관측 한 줄."""
    tm: str              # YYYYMMDDHHMI
    stn: int             # 지점번호
    ta: float | None     # 기온 (℃)
    hm: float | None     # 상대습도 (%)
    ts: float | None     # 지면온도 (℃)


# ============================================================
# 주요 ASOS 지점 위경도 (대표 지점만; 필요시 확장)
# 출처: 기상청 종관기상관측 지점정보 공식 (위경도는 관측소 위치 기준).
# ============================================================
STATION_LOCATIONS: dict[int, tuple[float, float]] = {
    90:  (38.2509, 128.5647),   # 속초
    101: (37.9026, 127.7355),   # 춘천
    105: (37.7515, 128.8910),   # 강릉
    108: (37.5714, 126.9658),   # 서울
    112: (37.4769, 126.6249),   # 인천
    115: (37.3373, 130.8980),   # 울릉도
    119: (37.2746, 126.9988),   # 수원
    129: (36.7724, 126.4982),   # 서산
    131: (36.6394, 127.4413),   # 청주
    133: (36.3722, 127.3739),   # 대전
    135: (36.2204, 128.2872),   # 추풍령
    138: (36.0327, 129.3800),   # 포항
    143: (35.8908, 128.6562),   # 대구
    146: (35.8226, 127.1192),   # 전주
    152: (35.5821, 129.3296),   # 울산
    156: (35.1729, 126.8916),   # 광주
    159: (35.1047, 129.0320),   # 부산
    162: (34.8083, 126.3815),   # 목포
    165: (34.6815, 126.3814),   # 흑산도
    168: (34.7393, 127.7405),   # 여수
    184: (33.5141, 126.5297),   # 제주
    189: (33.2461, 126.5604),   # 서귀포
    192: (35.1648, 128.0398),   # 진주
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 위경도 사이 대권거리 (km)."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat * 0.5) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon * 0.5) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def nearest_station(lat: float, lon: float) -> tuple[int, float]:
    """
    주어진 위경도에서 가장 가까운 등록된 ASOS 지점.

    Returns:
        (지점번호, km 거리)
    """
    return min(
        (
            (stn, _haversine_km(lat, lon, sl[0], sl[1]))
            for stn, sl in STATION_LOCATIONS.items()
        ),
        key=lambda x: x[1],
    )


# ============================================================
# 응답 파싱
# ============================================================
def parse_asos_response(text: str) -> list[AsosRecord]:
    """
    KMA Hub ASOS 시간자료 응답 텍스트 → AsosRecord 리스트.

    - 헤더/주석(#)·빈 줄·컬럼 부족한 줄은 모두 건너뜀.
    - 결측값은 None 으로 정규화.
    """
    records: list[AsosRecord] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) < MIN_COLUMN_COUNT:
            continue
        try:
            stn = int(parts[COL_STN])
        except ValueError:
            continue
        records.append(
            AsosRecord(
                tm=parts[COL_TM],
                stn=stn,
                ta=_parse_float(parts[COL_TA]),
                hm=_parse_float(parts[COL_HM]),
                ts=_parse_float(parts[COL_TS]),
            )
        )
    return records


# ============================================================
# 공개 API
# ============================================================
def get_ground_temp_by_stn(records: list[AsosRecord], stn: int) -> float | None:
    """지점번호로 직접 TS 조회."""
    for r in records:
        if r.stn == stn:
            return r.ts
    return None


def get_ground_temp_at(
    records: list[AsosRecord],
    lat: float,
    lon: float,
    max_distance_km: float = 100.0,
) -> float | None:
    """
    위경도에서 가장 가까운 등록 지점의 TS 반환.

    Args:
        records: parse_asos_response 결과
        lat, lon: 사용자 위경도
        max_distance_km: 이보다 멀면 None (해외·먼바다 등)

    Returns:
        지면온도 (℃) 또는 None (가까운 지점 없음 / TS 결측)
    """
    stn, dist = nearest_station(lat, lon)
    if dist > max_distance_km:
        return None
    return get_ground_temp_by_stn(records, stn)
