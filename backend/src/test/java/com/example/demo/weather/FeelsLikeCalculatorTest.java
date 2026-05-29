package com.example.demo.weather;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FeelsLikeCalculatorTest {

    @Test
    void calculate_success() {

        double result =
                FeelsLikeCalculator.calculate(
                        30.0,
                        70.0,
                        2.0
                );

        assertThat(result)
                .isBetween(30.0, 40.0);
    }

    @Test
    void negative_temperature_success() {

        double result =
                FeelsLikeCalculator.calculate(
                        -5.0,
                        40.0,
                        3.0
                );

        assertThat(result)
                .isNotNaN();
    }

    @Test
    void extreme_humidity_success() {

        double result =
                FeelsLikeCalculator.calculate(
                        35.0,
                        100.0,
                        1.0
                );

        assertThat(result)
                .isNotNaN();
    }

    @Test
    void zero_wind_success() {

        double result =
                FeelsLikeCalculator.calculate(
                        28.0,
                        60.0,
                        0.0
                );

        assertThat(result)
                .isNotNaN();
    }
}