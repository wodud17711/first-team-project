package com.example.demo.walk;

import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.weather.WeatherSnapshot;
import com.example.demo.weather.WeatherSnapshotRepository;
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
            Long dogId
    ) {

        Dog dog =
                dogRepository.findById(dogId)
                        .orElseThrow();

        WeatherSnapshot snapshot =
                weatherSnapshotRepository.findTopByOrderByBaseDateTimeDesc()
                        .orElseThrow();

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

        int ageYears =
                Period.between(
                        dog.getBirthDate(),
                        LocalDate.now()
                ).getYears();

        return new WalkScoreRequest.DogInfo(

                dog.getBreed().getNameKr(),

                dog.getBreed().getSize(),

                dog.getBreed().getCoatType(),

                ageYears,

                dog.getWeight().doubleValue(),

                dog.getBreed().isBrachycephalic(),

                dog.getBreed().getHeatTolerance(),

                dog.getBreed().getColdTolerance()
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

                snapshot.getGroundTemperature(),

                0,
                0,

                "없음",

                0
        );
    }

    private final WeatherSnapshot weatherSnapshot;
    private static final int DEFAULT_PM10 = 0;
    private static final int DEFAULT_PM25 = 0;
    private static final int DEFAULT_UV_INDEX = 0;
    private static final String DEFAULT_PRECIPITATION_TYPE = "없음";

    // TODO(#xx): WeatherSnapshot 에 아직 없는 데이터. 추후 AirKorea / UV API 연동 시 실제 값으로 교체.
    WalkScoreRequest.WeatherInfo weatherInfo =
            new WalkScoreRequest.WeatherInfo(
                    weatherSnapshot.getTemperature(),
                    weatherSnapshot.getFeelsLikeTemperature(),
                    (int) weatherSnapshot.getHumidity(),
                    weatherSnapshot.getWindSpeed(),
                    weatherSnapshot.getGroundTemperature(),

                    // TODO: AirKorea API 연동
                    DEFAULT_PM10,

                    // TODO: AirKorea API 연동
                    DEFAULT_PM25,

                    // TODO: KMA PTY 연동
                    DEFAULT_PRECIPITATION_TYPE,

                    // TODO: UV API 연동
                    DEFAULT_UV_INDEX
            );
}