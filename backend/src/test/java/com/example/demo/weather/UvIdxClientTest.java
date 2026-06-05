package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.UvIdxClient;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

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
}