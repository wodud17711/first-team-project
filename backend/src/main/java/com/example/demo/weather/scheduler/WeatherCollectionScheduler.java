package com.example.demo.weather.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.example.demo.weather.facade.WeatherCollectionFacade;

@Component
@RequiredArgsConstructor
@Slf4j
public class WeatherCollectionScheduler {

    private final WeatherCollectionFacade weatherCollectionFacade;

    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void collectBusanWeather() {

        try {
            weatherCollectionFacade.collectSafely();
        } catch (Exception e) {
            log.error("[WeatherScheduler] unexpected failure (outer catch)", e);
        }
    }
}