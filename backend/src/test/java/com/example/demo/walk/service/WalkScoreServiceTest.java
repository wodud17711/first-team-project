package com.example.demo.walk.service;

import com.example.demo.dog.entity.ActivityLevel;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.Gender;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResponse;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import com.example.demo.walk.repository.WalkScoreRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
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
                        5,
                        20,
                        20
                );

        weatherSnapshotRepository.save(snapshot);

        // ✔ 수정된 부분 (WalkScoreResult 6인자 유지)
        WalkScoreResult aiResult =
                new WalkScoreResult(
                        85,
                        "주의",
                        List.of("기온 높음"),
                        List.of("FEELS_HOT"),
                        List.of("기온 높음"),
                        List.of("FEELS_HOT")
                );

        given(aiClient.calculateScore(any()))
                .willReturn(aiResult);

        // when
        walkScoreService.calculateScore(
                1L,
                dog.getId()
        );

        // then
        List<WalkScore> scores =
                walkScoreRepository.findByDogId(dog.getId());

        assertThat(scores).hasSize(1);

        WalkScore saved = scores.get(0);

        assertThat(saved.getScore()).isEqualTo(85);
        assertThat(saved.getLevel()).isEqualTo("주의");
        assertThat(saved.getDog().getId()).isEqualTo(dog.getId());
    }

    @Test
    void 날씨_스냅샷_없어도_baseline_폴백으로_실제_점수_반환_503_아님() {

        // given: 강아지만 있고 날씨 스냅샷은 전부 비운 상태 (기상청 키/수집 없음 상황)
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

        weatherSnapshotRepository.deleteAll();

        WalkScoreResult aiResult =
                new WalkScoreResult(
                        100,
                        "안전",
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of()
                );

        given(aiClient.calculateScore(any()))
                .willReturn(aiResult);

        // when: 503(WEATHER_API_ERROR) 없이 점수가 나와야 한다
        WalkScoreResponse result =
                walkScoreService.calculateScore(
                        1L,
                        dog.getId()
                );

        // then 1) 점수 반환 + 점수 저장
        assertThat(result.score()).isEqualTo(100);
        assertThat(walkScoreRepository.findByDogId(dog.getId())).hasSize(1);

        // then 2) baseline 폴백 스냅샷이 시드되어 1건 존재
        assertThat(weatherSnapshotRepository.count()).isEqualTo(1);

        // then 3) 가짜 점수가 아니라, baseline 날씨값이 실제로 룰베이스에 입력됐는지 확인
        ArgumentCaptor<WalkScoreRequest> captor =
                ArgumentCaptor.forClass(WalkScoreRequest.class);
        verify(aiClient).calculateScore(captor.capture());

        WalkScoreRequest.WeatherInfo weather = captor.getValue().weather();
        assertThat(weather.temperature()).isEqualTo(24.0);
        assertThat(weather.humidity()).isEqualTo(65);
        assertThat(weather.pm10()).isEqualTo(35);

        // then 4) 응답에도 동일한 baseline 날씨값이 실려 FE 카드가 실측을 표시할 수 있다
        assertThat(result.weather()).isNotNull();
        assertThat(result.weather().temperature()).isEqualTo(24.0);
        assertThat(result.weather().humidity()).isEqualTo(65.0);
        assertThat(result.weather().pm10()).isEqualTo(35);
        assertThat(result.weather().uvIndex()).isEqualTo(5);
    }
}