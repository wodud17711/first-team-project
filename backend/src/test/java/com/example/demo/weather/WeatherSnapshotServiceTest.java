package com.example.demo.weather;

import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import com.example.demo.weather.service.WeatherSnapshotService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class WeatherSnapshotServiceTest {

    @Test
    @DisplayName("캐시 조회")
    void find_snapshot_success() {

        WeatherSnapshotRepository repository =
                mock(WeatherSnapshotRepository.class);

        WeatherSnapshotService service =
                new WeatherSnapshotService(repository);

        LocalDateTime now =
                LocalDateTime.now();

        WeatherSnapshot snapshot =
                WeatherSnapshot.builder()
                        .gridX(60)
                        .gridY(127)
                        .baseDateTime(now)
                        .temperature(25)
                        .humidity(60)
                        .windSpeed(2)
                        .feelsLikeTemperature(26)
                        .groundTemperature(28.0)
                        .build();

        when(repository.findByGridXAndGridYAndBaseDateTime(
                60,
                127,
                now
        )).thenReturn(Optional.of(snapshot));

        Optional<WeatherSnapshot> result =
                service.findSnapshot(
                        60,
                        127,
                        now
                );

        assertThat(result).isPresent();
    }
}