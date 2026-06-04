package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.UvIdxClient;
import com.example.demo.weather.domain.UvIndex;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@SpringBootTest
class UvIdxClientTest {

    @Autowired
    private UvIdxClient uvIdxClient;

    @MockitoBean
    private UvIdxClient mockUvIdxClient;

    private static final String SEOUL = "1100000000";

    @Test
    void areaNo가_10자리_아니면_INVALID_INPUT() {
        assertThatThrownBy(() -> uvIdxClient.fetch("11000"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void null_areaNo면_INVALID_INPUT() {
        assertThatThrownBy(() -> uvIdxClient.fetch(null))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void 정상_호출이면_UVIndex_생성된다() {

        UvIndex fake = new UvIndex(
                SEOUL,
                LocalDateTime.of(2026, 5, 26, 6, 0),
                Map.of(0, 1, 3, 5, 6, 6)
        );

        given(mockUvIdxClient.fetch(SEOUL))
                .willReturn(fake);

        UvIndex uv = mockUvIdxClient.fetch(SEOUL);

        assertThat(uv.areaNo()).isEqualTo(SEOUL);
        assertThat(uv.at(6)).isEqualTo(6);
    }
}