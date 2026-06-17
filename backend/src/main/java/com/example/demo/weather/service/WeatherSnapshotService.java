package com.example.demo.weather.service;

import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import com.example.demo.weather.support.WeatherFallbackSnapshot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@Transactional(readOnly = true)
public class WeatherSnapshotService {

    // baseline은 실시간 수집값이 아니므로 명백히 과거 시각으로 박아
    // 산책점수 조회 시 "폴백" 으로 구분되게 한다.
    private static final int BASELINE_AGE_HOURS = 24;

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

    /**
     * 스냅샷이 하나도 없으면 부산 baseline 폴백을 저장한다(있으면 그대로 최신 반환).
     * 앱 시작 시(시더) / 산책점수 조회 시 모두 호출되며, 기상청 키·네트워크 없이도
     * 산책점수가 항상 나오도록 최소 1건을 보장한다.
     */
    @Transactional
    public WeatherSnapshot ensureBaselinePresent() {

        return repository.findTopByOrderByBaseDateTimeDesc()
                .orElseGet(() -> {

                    WeatherSnapshot baseline =
                            WeatherFallbackSnapshot.busanBaseline(
                                    LocalDateTime.now()
                                            .minusHours(BASELINE_AGE_HOURS)
                                            .truncatedTo(ChronoUnit.HOURS)
                            );

                    WeatherSnapshot saved =
                            repository.save(baseline);

                    log.warn(
                            "[WeatherSnapshot] 수집된 스냅샷 없음 → 부산 baseline 폴백 저장 (id={}, baseDateTime={})",
                            saved.getId(),
                            saved.getBaseDateTime()
                    );

                    return saved;
                });
    }
}