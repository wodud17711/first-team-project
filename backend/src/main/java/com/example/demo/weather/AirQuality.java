package com.example.demo.weather;

/**
 * 한 측정소의 미세먼지 측정 결과. 룰베이스 미세먼지 가중치 입력.
 *
 * <p>{@code pm10}/{@code pm25} 는 결측이면 {@code null}(μg/m³).
 */
public record AirQuality(

        String sidoName,
        String stationName,
        String dataTime,
        Integer pm10,
        Integer pm25
) {
}
