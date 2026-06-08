package com.example.demo.weather.service;

import com.example.demo.weather.AirKoreaClient;
import com.example.demo.weather.AirQuality;
import com.example.demo.weather.client.WeatherClient;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.util.GridCoordinate;
import com.example.demo.weather.util.GridConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WeatherCollectorService {

    private final WeatherClient weatherClient;
    private final AirKoreaClient airKoreaClient;
    private final WeatherSnapshotService weatherSnapshotService;

    @Transactional
    public WeatherSnapshot collect(
            double lat,
            double lon
    ) {

        GridCoordinate grid =
                GridConverter.toGrid(
                        lat,
                        lon
                );

        WeatherSnapshot weather =
                weatherClient.fetchCurrent(
                        grid.nx(),
                        grid.ny()
                );

        AirQuality airQuality =
                airKoreaClient.fetchAirQuality(
                        lat,
                        lon
                );

        WeatherSnapshot snapshot =
                WeatherSnapshot.create(
                        weather.getGridX(),
                        weather.getGridY(),
                        weather.getBaseDateTime(),
                        weather.getTemperature(),
                        weather.getHumidity(),
                        weather.getWindSpeed(),
                        weather.getFeelsLikeTemperature(),
                        weather.getGroundTemperature(),
                        weather.getUvIndex(),
                        airQuality.pm10(),
                        airQuality.pm25()
                );

        return weatherSnapshotService.saveIfAbsent(
                snapshot
        );
    }
}