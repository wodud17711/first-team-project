package com.example.demo.weather;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface WeatherSnapshotRepository
        extends JpaRepository<WeatherSnapshot, Long> {

    Optional<WeatherSnapshot> findByGridXAndGridYAndBaseDateTime(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime
    );

    Optional<WeatherSnapshot> findTopByOrderByBaseDateTimeDesc();
}