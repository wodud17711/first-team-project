package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.WeatherClient;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.dto.KmaForecastResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WeatherClientTest {

    // =========================
    // 좌표 검증 (순수 로직)
    // =========================
    @Test
    void 격자_범위를_벗어나면_INVALID_INPUT() {
        assertThatThrownBy(() ->
                WeatherClient.validateGrid(0, 300)
        ).isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    // =========================
    // 발표 시간 계산 (순수 로직)
    // =========================
    @Test
    void 발표시간_선택_로직_검증() {

        var base = WeatherClient.resolveBaseDateTime(
                LocalDateTime.of(2026, 5, 20, 9, 0)
        );

        assertThat(base.date()).isEqualTo("20260520");
        assertThat(base.time()).isEqualTo("0800");
    }

    // =========================
    // 파싱 로직만 테스트 (핵심)
    // =========================
    @Test
    void parse_정상응답이면_스냅샷생성() {

        KmaForecastResponse response = ok(List.of(
                item("TMP", "0900", "18"),
                item("REH", "0900", "85"),
                item("WSD", "0900", "3.3")
        ));

        WeatherSnapshot snapshot =
                WeatherClient.parse(response, 60, 127);

        assertThat(snapshot.getTemperature()).isEqualTo(18.0);
        assertThat(snapshot.getHumidity()).isEqualTo(85.0);
        assertThat(snapshot.getWindSpeed()).isEqualTo(3.3);
    }

    private static KmaForecastResponse.Item item(
            String category, String time, String value
    ) {
        return new KmaForecastResponse.Item(category, "20260520", time, value);
    }

    private static KmaForecastResponse ok(List<KmaForecastResponse.Item> items) {
        return new KmaForecastResponse(
                new KmaForecastResponse.Response(
                        new KmaForecastResponse.Header("00", "OK"),
                        new KmaForecastResponse.Body(
                                new KmaForecastResponse.Items(items)
                        )
                )
        );
    }
}