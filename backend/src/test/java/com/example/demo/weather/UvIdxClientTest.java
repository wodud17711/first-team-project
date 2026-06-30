package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.UvIdxClient;
import com.example.demo.weather.domain.UvIndex;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UvIdxClientTest {

    @Test
    void areaNo_10자리아니면_INVALID_INPUT() {

        assertThatThrownBy(() ->
                UvIdxClient.validateAreaNo("11000")
        )
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void null_areaNo면_INVALID_INPUT() {

        assertThatThrownBy(() ->
                UvIdxClient.validateAreaNo(null)
        )
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void 발표시각_계산() {

        String result =
                UvIdxClient.resolveBaseTime(
                        LocalDateTime.of(2026, 5, 26, 20, 0)
                );

        assertThat(result)
                .isEqualTo("2026052618");
    }

    /**
     * 06시 발표 데이터: h0(06시)=0, h6(정오)=6 ... 인 상황에서
     * 정오에 currentAt 을 부르면 발표시각 값(0)이 아니라 정오 피크값(6)을 골라야 한다.
     * (운영 자외선 0 고정 버그: current()=h0 만 저장하던 것을 바로잡음)
     */
    @Test
    void currentAt_정오면_발표시각0이아니라_피크값() {

        LocalDateTime base = LocalDateTime.of(2026, 6, 29, 6, 0); // 06시 발표

        Map<Integer, Integer> hourly = new LinkedHashMap<>();
        hourly.put(0, 0);   // 06시
        hourly.put(3, 2);   // 09시
        hourly.put(6, 6);   // 12시 (피크)
        hourly.put(9, 3);   // 15시

        UvIndex uv = new UvIndex("2600000000", base, hourly);

        // 정오 호출 → 경과 6h → h6 = 6
        assertThat(uv.currentAt(LocalDateTime.of(2026, 6, 29, 12, 0)))
                .isEqualTo(6);

        // 발표시각(+0h)은 여전히 0 — current() 와의 차이 확인
        assertThat(uv.current()).isEqualTo(0);
    }

    @Test
    void currentAt_데이터없으면_null() {

        UvIndex uv = new UvIndex(
                "2600000000",
                LocalDateTime.of(2026, 6, 29, 6, 0),
                Map.of()
        );

        assertThat(uv.currentAt(LocalDateTime.of(2026, 6, 29, 12, 0)))
                .isNull();
    }
}