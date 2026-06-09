package com.example.demo.weather.forecast;

import java.time.LocalDateTime;

public record ForecastSlot(
        LocalDateTime forecastTime,
        double temperature,
        double feelsLike,
        double humidity,
        double windSpeed
) {}