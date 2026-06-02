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

                // TODO: AirKorea 연동 후 실제 PM10 값 사용
                0,

                // TODO: AirKorea 연동 후 실제 PM2.5 값 사용
                0,

                // TODO: 기상청 PTY 연동 후 실제 강수 형태 사용
                "없음",

                // TODO: UV API 연동 후 실제 UV Index 사용
                0
        );
    }
}