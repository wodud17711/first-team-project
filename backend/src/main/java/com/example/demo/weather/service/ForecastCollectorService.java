package com.example.demo.weather.service;

import com.example.demo.weather.client.WeatherClient;
import com.example.demo.weather.forecast.ForecastSlot;
import com.example.demo.weather.repository.InMemoryForecastRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForecastCollectorService {

    private final WeatherClient weatherClient;
    private final InMemoryForecastRepository repository;

    public void collectBusanForecast() {

        List<ForecastSlot> slots =
                weatherClient.fetchForecastSlots(
                        98,
                        76
                );

        repository.save(slots);
    }
}