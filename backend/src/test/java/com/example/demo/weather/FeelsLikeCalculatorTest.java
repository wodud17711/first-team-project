package com.example.demo.weather;

import com.example.demo.weather.service.FeelsLikeCalculator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FeelsLikeCalculatorTest {

    // ========================================
    // 여름: Steadman
    // ========================================

    @Test
    void 폭염_고습_체감상승() {

        double result =
                FeelsLikeCalculator.calculate(
                        32,
                        75,
                        2
                );

        assertThat(result)
                .isBetween(33.0, 38.0);
    }

    @Test
    void 매우더움_다습() {

        double result =
                FeelsLikeCalculator.calculate(
                        35,
                        90,
                        1
                );

        assertThat(result)
                .isGreaterThanOrEqualTo(38.0);
    }

    @Test
    void 여름_저습_바람() {

        double result =
                FeelsLikeCalculator.calculate(
                        30,
                        30,
                        3
                );

        assertThat(result)
                .isBetween(28.0, 32.0);
    }

    @Test
    void 경계_여름시작_27도() {

        double result =
                FeelsLikeCalculator.calculate(
                        27,
                        50,
                        2
                );

        assertThat(result)
                .isBetween(24.0, 30.0);
    }

    // ========================================
    // 겨울: Wind Chill
    // ========================================

    @Test
    void 한파_강풍() {

        double result =
                FeelsLikeCalculator.calculate(
                        -3,
                        40,
                        5
                );

        assertThat(result)
                .isBetween(-12.0, -6.0);
    }

    @Test
    void 매우추움_강풍() {

        double result =
                FeelsLikeCalculator.calculate(
                        -10,
                        40,
                        10
                );

        assertThat(result)
                .isLessThanOrEqualTo(-17.0);
    }

    @Test
    void 경계_겨울시작_10도() {

        double result =
                FeelsLikeCalculator.calculate(
                        10,
                        50,
                        1.3
                );

        assertThat(result)
                .isBetween(7.0, 11.0);
    }

    // ========================================
    // 봄/가을 또는 무풍 겨울
    // ========================================

    @Test
    void 평년_봄_기온그대로() {

        double result =
                FeelsLikeCalculator.calculate(
                        20,
                        50,
                        2
                );

        assertThat(result)
                .isEqualTo(20.0);
    }

    @Test
    void 겨울_무풍_기온그대로() {

        double result =
                FeelsLikeCalculator.calculate(
                        -5,
                        50,
                        0
                );

        assertThat(result)
                .isEqualTo(-5.0);
    }

    @Test
    void 봄저녁_기온그대로() {

        double result =
                FeelsLikeCalculator.calculate(
                        15,
                        60,
                        3
                );

        assertThat(result)
                .isEqualTo(15.0);
    }

    // ========================================
    // 안정성 테스트
    // ========================================

    @Test
    void 극단값에서도_nan_발생하지않음() {

        double result =
                FeelsLikeCalculator.calculate(
                        -50,
                        100,
                        50
                );

        assertThat(Double.isNaN(result))
                .isFalse();
    }
}