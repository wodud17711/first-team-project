package com.example.demo.weather;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AirQualityStationLocatorTest {

    @Test
    @DisplayName("서울시청 좌표는 서울 중구 측정소가 가장 가깝다")
    void nearest_seoul_city_hall() {

        AirQualityStationLocator.Nearest nearest =
                AirQualityStationLocator.nearest(37.5663, 126.9779);

        assertThat(nearest.station().sidoName()).isEqualTo("서울");
        assertThat(nearest.station().stationName()).isEqualTo("중구");
        assertThat(nearest.distanceKm()).isLessThan(1.0);
    }

    @Test
    @DisplayName("부산 좌표는 부산 시도의 측정소로 매핑된다")
    void nearest_busan() {

        AirQualityStationLocator.Nearest nearest =
                AirQualityStationLocator.nearest(35.1151, 129.0413);

        assertThat(nearest.station().sidoName()).isEqualTo("부산");
    }

    @Test
    @DisplayName("대구 좌표는 대구 시도의 측정소로 매핑된다")
    void nearest_daegu() {

        AirQualityStationLocator.Nearest nearest =
                AirQualityStationLocator.nearest(35.8714, 128.6014);

        assertThat(nearest.station().sidoName()).isEqualTo("대구");
    }

    @Test
    @DisplayName("제주 좌표는 제주 시도의 측정소로 매핑된다")
    void nearest_jeju() {

        AirQualityStationLocator.Nearest nearest =
                AirQualityStationLocator.nearest(33.4996, 126.5312);

        assertThat(nearest.station().sidoName()).isEqualTo("제주");
    }
}
