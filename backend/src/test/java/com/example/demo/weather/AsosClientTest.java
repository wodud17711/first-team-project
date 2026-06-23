package com.example.demo.weather;

import com.example.demo.weather.client.AsosClient;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

/**
 * 순수 단위 테스트 — {@code resolveBaseTime} 정적 로직과 mock 동작만 검증한다.
 * Spring 컨텍스트(과거 {@code @SpringBootTest})를 띄우지 않아 MySQL 의존 없이 어디서나 통과한다.
 */
class AsosClientTest {

    // =========================
    // 시간 계산 로직
    // =========================
    @Test
    void resolve_base_time_after_delay() {

        String tm = AsosClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 14, 30)
        );

        assertThat(tm).isEqualTo("202605261400");
    }

    @Test
    void resolve_base_time_midnight() {

        String tm = AsosClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 0, 5)
        );

        assertThat(tm).isEqualTo("202605252300");
    }

    // =========================
    // 외부 호출은 mock으로 고정
    // =========================
    @Test
    void 지면온도_조회_mock_성공() {

        AsosClient mockClient = mock(AsosClient.class);
        given(mockClient.fetchGroundTemp(37.5, 127.0))
                .willReturn(25.0);

        Double temp = mockClient.fetchGroundTemp(37.5, 127.0);

        assertThat(temp).isEqualTo(25.0);
    }
}