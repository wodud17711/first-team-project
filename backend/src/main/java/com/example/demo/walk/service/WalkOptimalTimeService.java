package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.dto.OptimalTimeResponse;
import com.example.demo.walk.dto.SlotResult;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.forecast.ForecastSlot;
import com.example.demo.weather.repository.ForecastCacheRepository;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import com.example.demo.dog.entity.DogBreed;
import java.time.LocalDate;
import java.time.Period;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalkOptimalTimeService {

    private final DogRepository dogRepository;
    private final WeatherSnapshotRepository weatherSnapshotRepository;
    private final ForecastCacheRepository forecastRepository; // (캐시된 단기예보)
    private final AiClient aiClient;


    public OptimalTimeResponse calculate(Long userId, Long dogId) {

        Dog dog = dogRepository.findByIdAndUserId(dogId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));

        // 1) 현재 snapshot (PM / 지면온도 등)
        WeatherSnapshot snapshot =
                weatherSnapshotRepository.findTopByOrderByBaseDateTimeDesc()
                        .orElseThrow(() -> new BusinessException(ErrorCode.WEATHER_API_ERROR));

        // 2) 미래 예보 (캐시된 데이터)
        List<ForecastSlot> forecasts = forecastRepository.findLatest();

        List<SlotResult> slots = new ArrayList<>();

        for (ForecastSlot f : forecasts) {

            // 3) 현재 snapshot + 미래 날씨 merge
            WalkScoreRequest request = buildRequest(dog, snapshot, f);

            WalkScoreResult result = aiClient.calculateScore(request);

            slots.add(new SlotResult(
                    f.forecastTime(),
                    result.score(),
                    result.level(),
                    result.topReasonCodes()
            ));
        }

        // 4) best 추출 (상위 1~3개)
        List<SlotResult> best =
                slots.stream()
                        .sorted(Comparator.comparingInt(SlotResult::score).reversed())
                        .limit(3)
                        .toList();

        return new OptimalTimeResponse(slots, best);
    }

    private WalkScoreRequest buildRequest(
            Dog dog,
            WeatherSnapshot snapshot,
            ForecastSlot forecast
    ) {

        return new WalkScoreRequest(
                buildDogInfo(dog),
                buildWeatherInfo(snapshot, forecast)
        );
    }

    // 기존 buildDogInfo 그대로 사용
    private WalkScoreRequest.DogInfo buildDogInfo(
            Dog dog
    ) {

        DogBreed breed = dog.getBreed();

        int ageYears =
                dog.getBirthDate() != null
                        ? Period.between(
                        dog.getBirthDate(),
                        LocalDate.now()
                ).getYears()
                        : 3;

        double weight =
                dog.getWeight() != null
                        ? dog.getWeight().doubleValue()
                        : 10.0;

        if (breed == null) {

            return new WalkScoreRequest.DogInfo(
                    "믹스",
                    "중형",
                    "단모",
                    ageYears,
                    weight,
                    false,
                    3,
                    3
            );
        }

        return new WalkScoreRequest.DogInfo(
                breed.getNameKr(),
                breed.getSize(),
                breed.getCoatType(),
                ageYears,
                weight,
                breed.isBrachycephalic(),
                breed.getHeatTolerance(),
                breed.getColdTolerance()
        );
    }

    private WalkScoreRequest.WeatherInfo buildWeatherInfo(
            WeatherSnapshot snapshot,
            ForecastSlot forecast
    ) {

        return new WalkScoreRequest.WeatherInfo(

                forecast.temperature(),
                forecast.feelsLike(),

                (int) forecast.humidity(),

                forecast.windSpeed(),

                snapshot.getGroundTemperature(),

                snapshot.getPm10(),
                snapshot.getPm25(),

                forecast.precipitationType(),

                snapshot.getUvIndex() != null
                        ? snapshot.getUvIndex()
                        : 0
        );
    }
}
