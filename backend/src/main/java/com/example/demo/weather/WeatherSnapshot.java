package com.example.demo.weather;

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

    @Builder
    private WeatherSnapshot(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime,
            double temperature,
            double humidity,
            double windSpeed,
            double feelsLikeTemperature,
            Double groundTemperature
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
    }

    public static WeatherSnapshot create(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime,
            double temperature,
            double humidity,
            double windSpeed,
            double feelsLikeTemperature,
            Double groundTemperature
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