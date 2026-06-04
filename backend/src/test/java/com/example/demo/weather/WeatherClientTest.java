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

    // ============================================================
    // 좌표 검증
    // ============================================================
    @Test
    void 서울_격자는_정상() {
        // 예외 없이 통과
        WeatherClient.validateGrid(60, 127);
    }

    @Test
    void 격자_범위를_벗어나면_INVALID_INPUT() {

        assertThatThrownBy(() -> WeatherClient.validateGrid(0, 300))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    // ============================================================
    // 발표 일자/시각 계산
    // ============================================================
    @Test
    void 발표_10분_뒤부터_직전_발표시각_선택() {

        WeatherClient.BaseDateTime base =
                WeatherClient.resolveBaseDateTime(
                        LocalDateTime.of(2026, 5, 20, 9, 0)
                );

        assertThat(base.date()).isEqualTo("20260520");
        assertThat(base.time()).isEqualTo("0800");
    }

    @Test
    void 발표_직후_10분_이내면_이전_슬롯_사용() {

        // 08:05 → (−10분) 07:55 → 0800 아직 미발표 → 0500
        WeatherClient.BaseDateTime base =
                WeatherClient.resolveBaseDateTime(
                        LocalDateTime.of(2026, 5, 20, 8, 5)
                );

        assertThat(base.time()).isEqualTo("0500");
    }

    @Test
    void 새벽_첫_발표_이전이면_전날_2300() {

        WeatherClient.BaseDateTime base =
                WeatherClient.resolveBaseDateTime(
                        LocalDateTime.of(2026, 5, 20, 1, 0)
                );

        assertThat(base.date()).isEqualTo("20260519");
        assertThat(base.time()).isEqualTo("2300");
    }

    // ============================================================
    // 응답 파싱
    // ============================================================
    @Test
    void 정상_응답이면_가장_이른_예보로_스냅샷_생성() {

        KmaForecastResponse response = ok(List.of(
                item("TMP", "0900", "18"),
                item("REH", "0900", "85"),
                item("WSD", "0900", "3.3"),
                // 다음 시각 값은 무시되어야 함
                item("TMP", "1000", "17"),
                item("REH", "1000", "90"),
                item("WSD", "1000", "3.6")
        ));

        WeatherSnapshot snapshot =
                WeatherClient.parse(response, 60, 127);

        assertThat(snapshot.getGridX()).isEqualTo(60);
        assertThat(snapshot.getGridY()).isEqualTo(127);
        assertThat(snapshot.getTemperature()).isEqualTo(18.0);
        assertThat(snapshot.getHumidity()).isEqualTo(85.0);
        assertThat(snapshot.getWindSpeed()).isEqualTo(3.3);
        // 18℃ 는 폭염/한파 구간 밖 → 체감온도 = 실제 기온
        assertThat(snapshot.getFeelsLikeTemperature()).isEqualTo(18.0);
        assertThat(snapshot.getBaseDateTime())
                .isEqualTo(LocalDateTime.of(2026, 5, 20, 9, 0));
        assertThat(snapshot.getGroundTemperature()).isNull();
    }

    @Test
    void NODATA_응답이면_INVALID_INPUT() {

        KmaForecastResponse response = withResultCode("03");

        assertThatThrownBy(() -> WeatherClient.parse(response, 60, 127))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void 비정상_결과코드면_WEATHER_API_ERROR() {

        KmaForecastResponse response = withResultCode("99");

        assertThatThrownBy(() -> WeatherClient.parse(response, 60, 127))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.WEATHER_API_ERROR);
    }

    @Test
    void 필수_카테고리_누락이면_WEATHER_API_ERROR() {

        // REH/WSD 없이 TMP 만
        KmaForecastResponse response = ok(List.of(
                item("TMP", "0900", "18")
        ));

        assertThatThrownBy(() -> WeatherClient.parse(response, 60, 127))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.WEATHER_API_ERROR);
    }

    // ============================================================
    // 헬퍼
    // ============================================================
    private static KmaForecastResponse.Item item(
            String category, String fcstTime, String value
    ) {
        return new KmaForecastResponse.Item(category, "20260520", fcstTime, value);
    }

    private static KmaForecastResponse ok(List<KmaForecastResponse.Item> items) {
        return new KmaForecastResponse(
                new KmaForecastResponse.Response(
                        new KmaForecastResponse.Header("00", "NORMAL_SERVICE"),
                        new KmaForecastResponse.Body(
                                new KmaForecastResponse.Items(items)
                        )
                )
        );
    }

    private static KmaForecastResponse withResultCode(String code) {
        return new KmaForecastResponse(
                new KmaForecastResponse.Response(
                        new KmaForecastResponse.Header(code, "msg"),
                        new KmaForecastResponse.Body(
                                new KmaForecastResponse.Items(List.of())
                        )
                )
        );
    }
}
