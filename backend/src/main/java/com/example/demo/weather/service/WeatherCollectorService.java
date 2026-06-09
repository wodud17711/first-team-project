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

        // 1. 격자 변환 (외부 API와 무관)
        GridCoordinate grid = GridConverter.toGrid(lat, lon);

        // 2. 날씨 데이터 조회 (KMA)
        WeatherSnapshot weather =
                weatherClient.fetchCurrent(
                        grid.nx(),
                        grid.ny()
                );

        // 3. 미세먼지 데이터 조회 (AirKorea)
        AirQuality airQuality =
                airKoreaClient.fetchAirQuality(lat, lon);

        // 4. 도메인 조립 (여기가 collector 책임)
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

        // 5. 저장 (idempotent)
        return weatherSnapshotService.saveIfAbsent(snapshot);
    }
}