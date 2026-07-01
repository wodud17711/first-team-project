package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResponse;
import com.example.demo.walk.dto.WalkScoreResult;
import com.example.demo.walk.repository.WalkScoreRepository;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.facade.WeatherCollectionFacade;
import com.example.demo.weather.repository.WeatherSnapshotRepository;
import com.example.demo.weather.service.ForecastCollectorService;
import com.example.demo.weather.service.WeatherSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalkScoreService {

    // 최신 스냅샷이 이 시간 이상 오래되면(수집 스케줄러가 BE 무료 슬립으로 멈춘 경우 등)
    // 점수 조회 시점에 즉석 재수집(lazy refresh)을 시도한다. 수집 주기가 1시간이라 1시간으로 잡는다.
    private static final long STALE_AFTER_HOURS = 1;

    private final AiClient aiClient;
    private final DogRepository dogRepository;
    private final WeatherSnapshotRepository weatherSnapshotRepository;
    private final WeatherSnapshotService weatherSnapshotService;
    private final WeatherCollectionFacade weatherCollectionFacade;
    private final ForecastCollectorService forecastCollectorService;
    private final WalkScoreRepository walkScoreRepository;

    public WalkScoreResponse calculateScore(
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

        WeatherSnapshot snapshot = resolveWeatherSnapshot();

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

        // 점수 산출에 사용된 스냅샷의 실측 날씨값을 응답에 함께 실어 FE 카드가 표시할 수 있게 한다.
        return WalkScoreResponse.from(result, snapshot);
    }

    /**
     * 점수 계산에 쓸 날씨 스냅샷을 결정한다.
     * 기상청 키/네트워크 없이도 항상 점수가 나오도록 503 을 던지지 않고 폴백을 보장한다.
     *
     * <ul>
     *   <li>최신 스냅샷이 충분히 신선 → 실데이터 사용 (INFO)</li>
     *   <li>최신 스냅샷이 오래됨(수집 지연/실패) → 직전 스냅샷 재사용 폴백 (WARN)</li>
     *   <li>스냅샷이 아예 없음 → 부산 baseline 폴백 시드 후 사용 (WARN)</li>
     * </ul>
     * 어느 경로든 실제 룰베이스가 이 스냅샷으로 점수를 계산한다(가짜 점수 아님).
     */
    private WeatherSnapshot resolveWeatherSnapshot() {

        Optional<WeatherSnapshot> latest =
                weatherSnapshotRepository.findTopByOrderByBaseDateTimeDesc();

        if (latest.isEmpty()) {

            WeatherSnapshot seeded =
                    weatherSnapshotService.ensureBaselinePresent();

            log.warn(
                    "[WalkScore] 날씨 스냅샷 없음 → 부산 baseline 폴백 사용 (id={}, baseDateTime={}). 실제 룰로 점수 계산.",
                    seeded.getId(),
                    seeded.getBaseDateTime()
            );

            return seeded;
        }

        WeatherSnapshot snapshot = latest.get();

        long ageHours =
                Duration.between(
                        snapshot.getBaseDateTime(),
                        LocalDateTime.now()
                ).toHours();

        if (ageHours >= STALE_AFTER_HOURS) {

            log.warn(
                    "[WalkScore] 최신 날씨 수집 지연(age={}h) → 즉석 재수집 시도 (id={}, baseDateTime={})",
                    ageHours,
                    snapshot.getId(),
                    snapshot.getBaseDateTime()
            );

            WeatherSnapshot refreshed = tryRefreshWeather();
            if (refreshed != null) {
                log.info(
                        "[WalkScore] 즉석 재수집 성공 (id={}, baseDateTime={})",
                        refreshed.getId(),
                        refreshed.getBaseDateTime()
                );
                return refreshed;
            }

            log.warn("[WalkScore] 즉석 재수집 실패/무변화 → 직전 스냅샷 재사용 폴백");

        } else {

            log.info(
                    "[WalkScore] 실데이터 날씨 스냅샷 사용 (id={}, baseDateTime={}, age={}h)",
                    snapshot.getId(),
                    snapshot.getBaseDateTime(),
                    ageHours
            );
        }

        return snapshot;
    }

    /**
     * 날씨 수집이 멈췄을 때(BE 무료 슬립으로 스케줄러 정지 등) 점수 조회 시점에
     * 부산 날씨를 즉석 재수집한다. 외부 API 호출이라 다소 느릴 수 있으나 stale 일 때만 1회 수행.
     * 실패 시 null 반환 → 호출부가 직전 스냅샷으로 폴백(점수는 항상 나온다).
     */
    private WeatherSnapshot tryRefreshWeather() {
        try {
            weatherCollectionFacade.collectSafely();
            forecastCollectorService.collectBusanForecast();
            return weatherSnapshotRepository
                    .findTopByOrderByBaseDateTimeDesc()
                    .orElse(null);
        } catch (Exception e) {
            log.warn("[WalkScore] 즉석 날씨 재수집 실패", e);
            return null;
        }
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

        // AI(WeatherIn Pydantic) 검증 범위로 정규화한다.
        // 부분 수집으로 PM·UV 가 null 이거나(→ DTO primitive 언박싱 NPE), provisional ASOS
        // 이상치가 범위를 벗어나면(→ AI 422) walk-score 가 500 으로 번지던 문제 방지.
        // 점수는 항상 나오도록 한다.
        Double ground = snapshot.getGroundTemperature();
        Integer pm10 = snapshot.getPm10();
        Integer pm25 = snapshot.getPm25();
        Integer uv = snapshot.getUvIndex();

        return new WalkScoreRequest.WeatherInfo(

                clamp(snapshot.getTemperature(), -50, 60),

                clamp(snapshot.getFeelsLikeTemperature(), -60, 70),

                clamp((int) snapshot.getHumidity(), 0, 100),

                clamp(snapshot.getWindSpeed(), 0, 80),

                clamp(ground != null ? ground : 25.0, -50, 90),

                clamp(pm10 != null ? pm10 : 0, 0, 1000),

                clamp(pm25 != null ? pm25 : 0, 0, 1000),

                // TODO: AirKorea 연동 후 대기질 등급 실제 값 적용
                // 현재는 외부 연동 전 단계 -> 나중에 채워넣어야 함

                clamp(uv != null ? uv : 0, 0, 20)
        );
    }

    /** AI 검증 범위로 값을 가둔다(이상치·범위초과 방어). */
    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
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