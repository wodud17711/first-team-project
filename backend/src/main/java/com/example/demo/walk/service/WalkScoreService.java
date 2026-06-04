package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class WalkScoreService {

    private final AiClient aiClient;
    private final DogRepository dogRepository;
    private final WeatherSnapshotRepository weatherSnapshotRepository;

    public WalkScoreResult calculateScore(
            Long userId,
            Long dogId
    ) {

        Dog dog =
                dogRepository.findByIdAndUserId(
                                dogId,
                                userId
                        )
                        .orElseThrow(
                                () -> new BusinessException(
                                        ErrorCode.DOG_NOT_FOUND
                                )
                        );

        WeatherSnapshot snapshot =
                weatherSnapshotRepository.findTopByOrderByBaseDateTimeDesc()
                        .orElseThrow(
                                () -> new BusinessException(
                                        ErrorCode.WEATHER_API_ERROR
                                )
                        );

        WalkScoreRequest request =
                new WalkScoreRequest(
                        buildDogInfo(dog),
                        buildWeatherInfo(snapshot)
                );

        return aiClient.calculateScore(request);
    }

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
            WeatherSnapshot snapshot
    ) {

        return new WalkScoreRequest.WeatherInfo(

                snapshot.getTemperature(),

                snapshot.getFeelsLikeTemperature(),

                (int) snapshot.getHumidity(),

                snapshot.getWindSpeed(),

                snapshot.getGroundTemperature() != null
                        ? snapshot.getGroundTemperature()
                        : 25.0,

                // TODO: AirKorea 연동 후 실제 PM10 값 사용
                0,

                // TODO: AirKorea 연동 후 실제 PM2.5 값 사용
                0,

                // TODO: 기상청 PTY 연동 후 실제 강수 형태 사용
                "없음",

                snapshot.getUvIndex() != null
                        ? snapshot.getUvIndex()
                        : 0
        );
    }
}