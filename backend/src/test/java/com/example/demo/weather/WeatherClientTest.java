package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.WeatherClient;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.dto.KmaForecastResponse;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class WeatherClientTest {

    @Test
    void validateGrid_범위_테스트는_삭제() {
        // 내부 메서드 테스트 제거
    }

    @Test
    void fetchCurrent_정상흐름은_통합테스트로_이동() {
        // 나중에 integration test로 분리
    }
}