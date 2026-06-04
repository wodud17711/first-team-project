package com.example.demo.weather.service;

import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class WeatherSnapshotService {

    private final WeatherSnapshotRepository repository;

    public WeatherSnapshotService(
            WeatherSnapshotRepository repository
    ) {
        this.repository = repository;
    }

    public Optional<WeatherSnapshot> findSnapshot(
            int gridX,
            int gridY,
            LocalDateTime baseDateTime
    ) {

        return repository.findByGridXAndGridYAndBaseDateTime(
                gridX,
                gridY,
                baseDateTime
        );
    }

    @Transactional
    public WeatherSnapshot save(
            WeatherSnapshot snapshot
    ) {

        return repository.save(snapshot);
    }

    @Transactional
    public WeatherSnapshot saveIfAbsent(
            WeatherSnapshot snapshot
    ) {

        return repository
                .findByGridXAndGridYAndBaseDateTime(
                        snapshot.getGridX(),
                        snapshot.getGridY(),
                        snapshot.getBaseDateTime()
                )
                .orElseGet(() ->
                        repository.save(snapshot)
                );
    }
}