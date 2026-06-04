package com.example.demo.weather;

import com.example.demo.weather.client.AsosClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AsosClientTest {

    @Test
    @DisplayName("관측 지연(10분) 이후면 당시 정시 발표분")
    void resolve_base_time_after_delay() {

        String tm = AsosClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 14, 30));

        assertThat(tm).isEqualTo("202605261400");
    }

    @Test
    @DisplayName("정시 직후 10분 이내면 직전 정시 발표분")
    void resolve_base_time_within_delay() {

        String tm = AsosClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 14, 5));

        assertThat(tm).isEqualTo("202605261300");
    }

    @Test
    @DisplayName("자정 직후면 전날 23시 발표분")
    void resolve_base_time_after_midnight() {

        String tm = AsosClient.resolveBaseTime(
                LocalDateTime.of(2026, 5, 26, 0, 5));

        assertThat(tm).isEqualTo("202605252300");
    }
}
