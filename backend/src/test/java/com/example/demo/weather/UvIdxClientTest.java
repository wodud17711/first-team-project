package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.UvIdxClient;
import com.example.demo.weather.domain.UvIndex;
import com.example.demo.weather.dto.KmaUvResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UvIdxClientTest {

    private static final String SEOUL = "1100000000";

    // ============================================================
    // areaNo 검증
    // ============================================================
    @Test
    void 서울_areaNo는_정상() {
        UvIdxClient.validateAreaNo(SEOUL);
    }

    @Test
    void areaNo가_10자리_숫자가_아니면_INVALID_INPUT() {

        assertThatThrownBy(() -> UvIdxClient.validateAreaNo("11000"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void areaNo가_null이면_INVALID_INPUT() {

        assertThatThrownBy(() -> UvIdxClient.validateAreaNo(null))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    // ============================================================
    // 발표시각 계산 (06 / 18시 발표)
    // ============================================================
    @Test
    void 정오면_당일_06시_발표분() {

        String time = UvIdxClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 12, 0));

        assertThat(time).isEqualTo("2026052606");
    }

    @Test
    void 저녁이면_당일_18시_발표분() {

        String time = UvIdxClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 20, 0));

        assertThat(time).isEqualTo("2026052618");
    }

    @Test
    void 새벽_06시_이전이면_전날_18시_발표분() {

        String time = UvIdxClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 3, 0));

        assertThat(time).isEqualTo("2026052518");
    }

    // ============================================================
    // 응답 파싱 (kma-uv-sample.json 서울 값 기준)
    // ============================================================
    @Test
    void 정상_응답이면_당일_시간대별_지수로_파싱() {

        // 샘플: h0=1, h3=5, h6=6, h9=1, h12=0, h15=0, h18=0, h21=0, h24=0
        KmaUvResponse response = ok(new KmaUvResponse.Item(
                "A07_2", SEOUL, "2026052606",
                "1", "5", "6", "1", "0", "0", "0", "0", "0"
        ));

        UvIndex uv = UvIdxClient.parse(response, SEOUL);

        assertThat(uv.areaNo()).isEqualTo(SEOUL);
        assertThat(uv.baseDateTime())
                .isEqualTo(LocalDateTime.of(2026, 5, 26, 6, 0));
        assertThat(uv.current()).isEqualTo(1);
        assertThat(uv.at(6)).isEqualTo(6);
        assertThat(uv.at(12)).isZero();
    }

    @Test
    void 빈_문자열_시간대는_제외된다() {

        KmaUvResponse response = ok(new KmaUvResponse.Item(
                "A07_2", SEOUL, "2026052606",
                "1", "5", "", "1", "0", "0", "0", "0", ""
        ));

        UvIndex uv = UvIdxClient.parse(response, SEOUL);

        assertThat(uv.hourly()).containsOnlyKeys(0, 3, 9, 12, 15, 18, 21);
        assertThat(uv.at(6)).isNull();
        assertThat(uv.at(24)).isNull();
    }

    @Test
    void NODATA_응답이면_INVALID_INPUT() {

        KmaUvResponse response = withResultCode("03");

        assertThatThrownBy(() -> UvIdxClient.parse(response, SEOUL))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void 비정상_결과코드면_WEATHER_API_ERROR() {

        KmaUvResponse response = withResultCode("99");

        assertThatThrownBy(() -> UvIdxClient.parse(response, SEOUL))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.WEATHER_API_ERROR);
    }

    // ============================================================
    // 헬퍼
    // ============================================================
    private static KmaUvResponse ok(KmaUvResponse.Item item) {
        return new KmaUvResponse(
                new KmaUvResponse.Response(
                        new KmaUvResponse.Header("00", "NORMAL_SERVICE"),
                        new KmaUvResponse.Body(
                                new KmaUvResponse.Items(List.of(item))
                        )
                )
        );
    }

    private static KmaUvResponse withResultCode(String code) {
        return new KmaUvResponse(
                new KmaUvResponse.Response(
                        new KmaUvResponse.Header(code, "msg"),
                        new KmaUvResponse.Body(
                                new KmaUvResponse.Items(List.of())
                        )
                )
        );
    }
}
