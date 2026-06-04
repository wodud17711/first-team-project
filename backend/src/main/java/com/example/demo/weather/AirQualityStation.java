package com.example.demo.weather;

/**
 * 에어코리아 측정소 한 곳. 좌표→최근접 측정소 매핑용 정적 표의 항목.
 *
 * <p>{@code sidoName} 은 getCtprvnRltmMesureDnsty 의 입력(서울/부산/경기 …),
 * {@code stationName} 은 응답 {@code items[].stationName} 과 매칭하는 키다.
 */
public record AirQualityStation(

        String sidoName,
        String stationName,
        double lat,
        double lon
) {
}
