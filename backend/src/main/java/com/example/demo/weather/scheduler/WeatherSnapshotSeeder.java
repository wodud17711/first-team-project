package com.example.demo.weather.scheduler;

import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.service.WeatherSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 앱 시작 시 weather_snapshots 가 비어 있으면 부산 baseline 폴백을 1건 시드한다.
 *
 * <p>스케줄러({@link WeatherCollectionScheduler})가 기상청 키 없음/호출 실패로 아무것도
 * 수집하지 못해도, 데모에서 {@code /api/walk/score} 가 503 대신 실제 점수를 반환하도록 보장한다.
 * {@link WeatherSnapshotService#ensureBaselinePresent()} 는 idempotent 라 실데이터가 있으면 건드리지 않는다.
 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class WeatherSnapshotSeeder implements ApplicationRunner {

    private final WeatherSnapshotService weatherSnapshotService;

    @Override
    public void run(ApplicationArguments args) {

        WeatherSnapshot snapshot =
                weatherSnapshotService.ensureBaselinePresent();

        log.info(
                "[WeatherSeed] 시작 시 스냅샷 보장 완료 (id={}, baseDateTime={})",
                snapshot.getId(),
                snapshot.getBaseDateTime()
        );
    }
}
