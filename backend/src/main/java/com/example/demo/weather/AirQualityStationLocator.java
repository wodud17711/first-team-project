package com.example.demo.weather;

import java.util.List;

/**
 * 좌표(WGS84) → 가장 가까운 에어코리아 측정소를 고른다.
 *
 * <p>시도별 조회(getCtprvnRltmMesureDnsty) 응답에는 측정소 좌표가 없으므로,
 * ASOS({@link GroundTempParser})와 같은 방식으로 측정소→좌표 표를 두고
 * haversine 으로 최근접을 선택한다. 고른 측정소의 {@code sidoName} 으로 1회 호출하면
 * 해당 시도 전체 측정소가 내려오고, {@code stationName} 으로 값을 집어낸다.
 *
 * <p><b>표 정확도</b>: 서울 측정소명(중구·종로구)은 샘플 응답으로 검증됨. 그 외 시도는
 * 대표 측정소를 넣었으며 실제 응답의 stationName 과 다를 수 있다 — 이 경우
 * {@link AirKoreaClient} 가 해당 시도의 유효한 첫 측정소로 폴백한다(시도 단위 정확도는 유지).
 *
 * <p><b>데모 타깃 = 부산</b>: 데모 범위가 부산으로 고정되어, 실 API 로 대조할 측정소명은
 * 부산 1건("연산동", 2026-06-04 실호출 검증)뿐이다. 광복동은 PM 이 자주 결측("-")이라
 * 도시대기·값이 안정적인 연산동(부산시청권)으로 교체했다. 미일치·결측 시에도
 * {@link AirKoreaClient} 가 시도 내 값 있는 측정소로 폴백해 부산 PM 값은 보장된다.
 */
public final class AirQualityStationLocator {

    private static final double EARTH_RADIUS_KM = 6371.0;

    // 전국 주요 도시 대표 측정소. sidoName 은 에어코리아 입력 표기(서울/부산/경기 …).
    private static final List<AirQualityStation> STATIONS = List.of(

            // ----- 서울 (샘플 응답으로 측정소명 검증) -----
            new AirQualityStation("서울", "중구", 37.5640, 126.9759),
            new AirQualityStation("서울", "종로구", 37.5729, 126.9794),
            new AirQualityStation("서울", "강남구", 37.5172, 127.0473),

            // ----- 6대 광역시 -----
            new AirQualityStation("인천", "부평구", 37.5070, 126.7219),
            new AirQualityStation("부산", "연산동", 35.1796, 129.0756),   // 데모 타깃 — 실 API 로 검증(2026-06-04)
            new AirQualityStation("대구", "중구", 35.8693, 128.6062),
            new AirQualityStation("광주", "동구", 35.1460, 126.9230),
            new AirQualityStation("대전", "중구", 36.3255, 127.4214),
            new AirQualityStation("울산", "중구", 35.5694, 129.3328),

            // ----- 세종 + 도 단위 대표 -----
            new AirQualityStation("세종", "신흥동", 36.4870, 127.2820),
            new AirQualityStation("경기", "인계동", 37.2636, 127.0286),   // 수원
            new AirQualityStation("강원", "석사동", 37.8617, 127.7456),   // 춘천
            new AirQualityStation("충북", "복대동", 36.6315, 127.4549),   // 청주
            new AirQualityStation("충남", "독곶리", 36.7900, 126.4140),   // 서산권
            new AirQualityStation("전북", "삼천동", 35.8088, 127.1148),   // 전주
            new AirQualityStation("전남", "여천", 34.7393, 127.7405),     // 여수
            new AirQualityStation("경북", "장성동", 36.0190, 129.3435),   // 포항
            new AirQualityStation("경남", "용지동", 35.2280, 128.6811),   // 창원
            new AirQualityStation("제주", "이도동", 33.4996, 126.5312)
    );

    private AirQualityStationLocator() {
    }

    /**
     * 주어진 좌표에서 haversine 거리가 가장 짧은 측정소를 반환한다. 표가 전국을
     * 덮으므로 항상 한 곳을 돌려준다(거리 상한 없음).
     */
    public static Nearest nearest(double lat, double lon) {

        AirQualityStation nearestStation = null;

        double minimumDistanceKm = Double.MAX_VALUE;

        for (AirQualityStation station : STATIONS) {

            double distanceKm =
                    haversineKm(lat, lon, station.lat(), station.lon());

            if (distanceKm < minimumDistanceKm) {

                minimumDistanceKm = distanceKm;
                nearestStation = station;
            }
        }

        return new Nearest(nearestStation, minimumDistanceKm);
    }

    private static double haversineKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {

        double latitudeDifference = Math.toRadians(lat2 - lat1);

        double longitudeDifference = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latitudeDifference * 0.5)
                        * Math.sin(latitudeDifference * 0.5)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(longitudeDifference * 0.5)
                        * Math.sin(longitudeDifference * 0.5);

        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    public record Nearest(
            AirQualityStation station,
            double distanceKm
    ) {
    }
}
