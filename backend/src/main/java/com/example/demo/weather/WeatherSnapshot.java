package com.example.demo.weather;

import jakarta.persistence.*;

import java.time.LocalDateTime;

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
        }
)
public class WeatherSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "grid_x", nullable = false)
    private int gridX;

    @Column(name = "grid_y", nullable = false)
    private int gridY;

    @Column(name = "base_date_time", nullable = false)
    private LocalDateTime baseDateTime;

    @Column(nullable = false)
    private double temperature;

    @Column(nullable = false)
    private double humidity;

    @Column(nullable = false)
    private double windSpeed;

    @Column(nullable = false)
    private double feelsLikeTemperature;

    @Column
    private Double groundTemperature;

    protected WeatherSnapshot() {
    }

    public WeatherSnapshot(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime,
            double temperature,
            double humidity,
            double windSpeed,
            double feelsLikeTemperature,
            Double groundTemperature
    ) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.baseDateTime = baseDateTime;
        this.temperature = temperature;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.feelsLikeTemperature = feelsLikeTemperature;
        this.groundTemperature = groundTemperature;
    }

    public Long getId() {
        return id;
    }

    public int getGridX() {
        return gridX;
    }

    public int getGridY() {
        return gridY;
    }

    public LocalDateTime getBaseDateTime() {
        return baseDateTime;
    }

    public double getTemperature() {
        return temperature;
    }

    public double getHumidity() {
        return humidity;
    }

    public double getWindSpeed() {
        return windSpeed;
    }

    public double getFeelsLikeTemperature() {
        return feelsLikeTemperature;
    }

    public Double getGroundTemperature() {
        return groundTemperature;
    }
}