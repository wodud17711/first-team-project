package com.example.demo.weather.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "weather_snapshots",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_weather_grid_time",
                        columnNames = {
                                "grid_x",
                                "grid_y",
                                "base_date_time"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_weather_grid_time",
                        columnList = "grid_x, grid_y, base_date_time"
                )
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WeatherSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "grid_x",
            nullable = false
    )
    private int gridX;

    @Column(
            name = "grid_y",
            nullable = false
    )
    private int gridY;

    @Column(
            name = "base_date_time",
            nullable = false
    )
    private LocalDateTime baseDateTime;

    @Column(
            nullable = false
    )
    private double temperature;

    @Column(
            nullable = false
    )
    private double humidity;

    @Column(
            nullable = false
    )
    private double windSpeed;

    @Column(
            nullable = false
    )
    private double feelsLikeTemperature;

    @Column
    private Double groundTemperature;

    // 자외선지수(생활기상지수 V5, 0~11+). 별도 API(UvIdxClient)에서 보강하므로
    // 미보강 상태는 null. 룰베이스 v1.2 UV_HIGH/UV_VERY_HIGH 입력.
    @Column(
            name = "uv_index"
    )
    private Integer uvIndex;

    // 미세먼지(PM10, μg/m³). AirKoreaClient에서 보강.
    // 결측 또는 미보강 상태는 null.
    // 룰베이스 v1.3 미세먼지 가중치 입력.
    @Column(
            name = "pm_10"
    )
    private Integer pm10;

    // 초미세먼지(PM2.5, μg/m³). AirKoreaClient에서 보강.
    // 결측 또는 미보강 상태는 null.
    // 룰베이스 v1.3 미세먼지 가중치 입력.
    @Column(
            name = "pm_25"
    )
    private Integer pm25;

    @Builder
    private WeatherSnapshot(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime,
            double temperature,
            double humidity,
            double windSpeed,
            double feelsLikeTemperature,
            Double groundTemperature,
            Integer uvIndex,
            Integer pm10,
            Integer pm25
    ) {

        validateHumidity(humidity);

        this.gridX = gridX;
        this.gridY = gridY;
        this.baseDateTime = baseDateTime;
        this.temperature = temperature;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.feelsLikeTemperature = feelsLikeTemperature;
        this.groundTemperature = groundTemperature;
        this.uvIndex = uvIndex;
        this.pm10 = pm10;
        this.pm25 = pm25;
    }

    public static WeatherSnapshot create(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime,
            double temperature,
            double humidity,
            double windSpeed,
            double feelsLikeTemperature,
            Double groundTemperature,
            Integer uvIndex,
            Integer pm10,
            Integer pm25
    ) {

        return WeatherSnapshot.builder()
                .gridX(gridX)
                .gridY(gridY)
                .baseDateTime(baseDateTime)
                .temperature(temperature)
                .humidity(humidity)
                .windSpeed(windSpeed)
                .feelsLikeTemperature(feelsLikeTemperature)
                .groundTemperature(groundTemperature)
                .uvIndex(uvIndex)
                .pm10(pm10)
                .pm25(pm25)
                .build();
    }

    private static void validateHumidity(
            double humidity
    ) {

        if (humidity < 0 || humidity > 100) {

            throw new IllegalArgumentException(
                    "humidity must be between 0 and 100"
            );
        }
    }
}