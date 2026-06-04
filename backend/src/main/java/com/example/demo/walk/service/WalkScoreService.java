package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.walk.repository.WalkScoreRepository;
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
    private final WalkScoreRepository walkScoreRepository;

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

        WalkScoreResult result =
                aiClient.calculateScore(request);

        saveWalkScore(
                dog,
                snapshot,
                result
        );

        return result;
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

                0,

                0,

                "없음",

                snapshot.getUvIndex() != null
                        ? snapshot.getUvIndex()
                        : 0
        );
    }

    private void saveWalkScore(
            Dog dog,
            WeatherSnapshot snapshot,
            WalkScoreResult result
    ) {

        if (result == null) {
            return;
        }

        String reason =
                result.reasons() == null
                        ? ""
                        : String.join(
                        ", ",
                        result.reasons()
                );

        WalkScore walkScore =
                WalkScore.create(
                        dog,
                        snapshot,
                        result.score(),
                        result.level(),
                        reason
                );

        walkScoreRepository.save(
                walkScore
        );
    }
}