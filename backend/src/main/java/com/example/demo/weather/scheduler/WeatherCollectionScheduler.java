package com.example.demo.weather.scheduler;

import com.example.demo.weather.service.ForecastCollectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.example.demo.weather.facade.WeatherCollectionFacade;

@Component
@Lazy(false) // 운영 prod 의 spring.main.lazy-initialization=true 환경에서도 @Scheduled 등록 보장(eager)
@RequiredArgsConstructor
@Slf4j
public class WeatherCollectionScheduler {

    private final WeatherCollectionFacade weatherCollectionFacade;
    private final ForecastCollectorService forecastCollectorService;

    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void collectBusanWeather() {

        try {
            weatherCollectionFacade.collectSafely();
            forecastCollectorService.collectBusanForecast();
        } catch (Exception e) {
            log.error("[WeatherScheduler] unexpected failure (outer catch)", e);
        }
    }
}