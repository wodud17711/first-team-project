package com.example.demo.weather.facade;

import com.example.demo.common.constant.DemoLocation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.example.demo.weather.service.WeatherCollectorService;
import io.micrometer.core.instrument.MeterRegistry;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherCollectionFacade {

    private final WeatherCollectorService collector;
    private final MeterRegistry meterRegistry;

    public void collectSafely() {

        try {
            collector.collect(
                    DemoLocation.BUSAN_LAT,
                    DemoLocation.BUSAN_LON
            );

            // ✅ 성공 metric
            meterRegistry.counter("weather.collect.success").increment();

        } catch (Exception e) {

            // ❗ 실패 metric
            meterRegistry.counter("weather.collect.fail").increment();

            log.error(
                    "[WeatherFacade] collect failed (lat={}, lon={})",
                    DemoLocation.BUSAN_LAT,
                    DemoLocation.BUSAN_LON,
                    e
            );
        }
    }
}