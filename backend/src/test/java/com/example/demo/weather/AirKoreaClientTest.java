package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AirKoreaClientTest {

    private static AirKoreaResponse response(List<AirKoreaResponse.Item> items) {
        return new AirKoreaResponse(
                new AirKoreaResponse.Response(
                        new AirKoreaResponse.Header("00", "NORMAL_CODE"),
                        new AirKoreaResponse.Body(items, items.size())
                )
        );
    }

    private static AirKoreaResponse.Item item(
            String station, String pm10, String pm25) {
        return new AirKoreaResponse.Item(
                station, "서울", "2026-05-20 10:00", pm10, pm25);
    }

    @Test
    @DisplayName("최근접 측정소(중구)의 PM10/PM2.5 를 뽑는다")
    void select_preferred_station() {

        AirKoreaResponse response = response(List.of(
                item("중구", "32", "22"),
                item("종로구", "31", "19")
        ));

        AirQuality result = AirKoreaClient.select(response, "중구");

        assertThat(result.stationName()).isEqualTo("중구");
        assertThat(result.pm10()).isEqualTo(32);
        assertThat(result.pm25()).isEqualTo(22);
    }

    @Test
    @DisplayName("표의 측정소명이 응답에 없으면 PM 값이 유효한 첫 측정소로 폴백한다")
    void select_falls_back_when_station_absent() {

        AirKoreaResponse response = response(List.of(
                item("종로구", "31", "19"),
                item("중구", "32", "22")
        ));

        AirQuality result = AirKoreaClient.select(response, "없는측정소");

        assertThat(result.stationName()).isEqualTo("종로구");
        assertThat(result.pm10()).isEqualTo(31);
    }

    @Test
    @DisplayName("최근접 측정소가 매칭돼도 PM 이 전부 결측이면 값 있는 측정소로 폴백한다")
    void select_falls_back_when_matched_has_no_pm() {

        AirKoreaResponse response = response(List.of(
                item("광복동", "-", "-"),
                item("초량동", "20", "5")
        ));

        AirQuality result = AirKoreaClient.select(response, "광복동");

        assertThat(result.stationName()).isEqualTo("초량동");
        assertThat(result.pm10()).isEqualTo(20);
        assertThat(result.pm25()).isEqualTo(5);
    }

    @Test
    @DisplayName("결측값(\"-\")은 null 로 변환된다")
    void select_missing_value_to_null() {

        AirKoreaResponse response = response(List.of(
                item("중구", "-", "22")
        ));

        AirQuality result = AirKoreaClient.select(response, "중구");

        assertThat(result.pm10()).isNull();
        assertThat(result.pm25()).isEqualTo(22);
    }

    @Test
    @DisplayName("resultCode 가 정상(00)이 아니면 AIRQUALITY_API_ERROR")
    void select_error_on_bad_result_code() {

        AirKoreaResponse response = new AirKoreaResponse(
                new AirKoreaResponse.Response(
                        new AirKoreaResponse.Header("99", "ERROR"),
                        new AirKoreaResponse.Body(List.of(), 0)
                )
        );

        assertThatThrownBy(() -> AirKoreaClient.select(response, "중구"))
                .isInstanceOf(BusinessException.class);
    }
}
