package com.example.demo.weather.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.example.demo.weather.service.WeatherCollectorService;
import com.example.demo.common.constant.DemoLocation;

@Component
@RequiredArgsConstructor
public class WeatherCollectionScheduler {

    private final WeatherCollectorService weatherCollectorService;

    @Scheduled(fixedRate = 60 * 60 * 1000) // 1시간
    public void collectBusanWeather() {
        weatherCollectorService.collect(
                DemoLocation.BUSAN_LAT,
                DemoLocation.BUSAN_LON
        );
    }
}