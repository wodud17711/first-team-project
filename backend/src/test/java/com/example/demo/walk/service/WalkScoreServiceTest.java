package com.example.demo.walk.service;

import com.example.demo.dog.entity.ActivityLevel;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.Gender;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.walk.repository.WalkScoreRepository;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@SpringBootTest
@Transactional
class WalkScoreServiceTest {

    @Autowired
    private WalkScoreService walkScoreService;

    @Autowired
    private DogRepository dogRepository;

    @Autowired
    private WeatherSnapshotRepository weatherSnapshotRepository;

    @Autowired
    private WalkScoreRepository walkScoreRepository;

    @MockitoBean
    private AiClient aiClient;

    @Test
    void 산책점수_조회시_DB에_저장된다() {

        // given
        Dog dog = Dog.create(
                1L,
                null,
                "초코",
                LocalDate.of(2022, 1, 1),
                BigDecimal.valueOf(5.0),
                Gender.M,
                true,
                false,
                ActivityLevel.MEDIUM,
                null,
                null,
                null
        );

        dogRepository.save(dog);

        WeatherSnapshot snapshot =
                WeatherSnapshot.create(
                        60,
                        127,
                        LocalDateTime.now(),
                        25.0,
                        60.0,
                        2.0,
                        26.0,
                        30.0,
                        5
                );

        weatherSnapshotRepository.save(snapshot);

        WalkScoreResult aiResult =
                new WalkScoreResult(
                        85,
                        "주의",
                        List.of("기온 높음"),
                        List.of("기온 높음")
                );

        given(
                aiClient.calculateScore(any())
        ).willReturn(aiResult);

        // when
        walkScoreService.calculateScore(
                1L,
                dog.getId()
        );

        // then
        List<WalkScore> scores =
                walkScoreRepository.findByDogId(
                        dog.getId()
                );

        assertThat(scores).hasSize(1);

        WalkScore saved = scores.get(0);

        assertThat(saved.getScore()).isEqualTo(85);
        assertThat(saved.getLevel()).isEqualTo("주의");
        assertThat(saved.getDog().getId()).isEqualTo(dog.getId());
    }
}