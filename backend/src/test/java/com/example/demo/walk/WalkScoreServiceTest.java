package com.example.demo.walk;

import com.example.demo.weather.WeatherSnapshot;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class WalkScoreServiceTest {

    private final WalkScoreService service =
            new WalkScoreService();

    @Test
    void 폭염이면_위험() {

        WeatherSnapshot snapshot =
                WeatherSnapshot.builder()
                        .gridX(60)
                        .gridY(127)
                        .baseDateTime(LocalDateTime.now())
                        .temperature(32)
                        .humidity(70)
                        .windSpeed(2)
                        .feelsLikeTemperature(35)
                        .groundTemperature(55.0)
                        .build();

        WalkScoreResult result =
                service.calculate(snapshot);

        assertThat(result.score())
                .isLessThan(50);

        assertThat(result.riskLevel())
                .isEqualTo(RiskLevel.DANGER);
    }
}