package com.example.demo.weather;

import com.example.demo.weather.dto.AsosRecord;
import com.example.demo.weather.util.GroundTempParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GroundTempParserTest {

    @Test
    @DisplayName("결측값은 null 로 변환된다")
    void parse_missing_value_success() {

        String text = """
                202501010000 108 0 0 0 0 0 0 0 0 0 -6.6 0 50 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -9.0
                """;

        List<AsosRecord> records =
                GroundTempParser.parse(text);

        assertThat(records).hasSize(1);

        assertThat(records.get(0).ts())
                .isNull();
    }

    @Test
    @DisplayName("서울은 108 관측소가 가장 가깝다")
    void nearest_station_seoul_success() {

        GroundTempParser.NearestStation station =
                GroundTempParser.nearestStation(
                        37.5665,
                        126.9780
                );

        assertThat(station.stationId())
                .isEqualTo(108);
    }

    @Test
    @DisplayName("부산은 159 관측소가 가장 가깝다")
    void nearest_station_busan_success() {

        GroundTempParser.NearestStation station =
                GroundTempParser.nearestStation(
                        35.1796,
                        129.0756
                );

        assertThat(station.stationId())
                .isEqualTo(159);
    }

    @Test
    @DisplayName("지점번호로 지면온도 조회")
    void get_ground_temp_by_station_success() {

        List<AsosRecord> records =
                List.of(
                        new AsosRecord(
                                "202501010000",
                                108,
                                -6.6,
                                50.0,
                                -2.2
                        )
                );

        Double result =
                GroundTempParser.getGroundTempByStation(
                        records,
                        108
                );

        assertThat(result)
                .isEqualTo(-2.2);
    }

    @Test
    @DisplayName("위경도로 지면온도 조회")
    void get_ground_temp_at_success() {

        List<AsosRecord> records =
                List.of(
                        new AsosRecord(
                                "202501010000",
                                108,
                                -6.6,
                                50.0,
                                -2.2
                        )
                );

        Double result =
                GroundTempParser.getGroundTempAt(
                        records,
                        37.5665,
                        126.9780
                );

        assertThat(result)
                .isEqualTo(-2.2);
    }

    @Test
    @DisplayName("최대 거리 초과 시 null 반환")
    void get_ground_temp_over_distance_returns_null() {

        List<AsosRecord> records =
                List.of(
                        new AsosRecord(
                                "202501010000",
                                108,
                                -6.6,
                                50.0,
                                -2.2
                        )
                );

        Double result =
                GroundTempParser.getGroundTempAt(
                        records,
                        35.6762,
                        139.6503,
                        100.0
                );

        assertThat(result)
                .isNull();
    }
}