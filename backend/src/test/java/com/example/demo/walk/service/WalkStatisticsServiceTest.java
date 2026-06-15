package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.ActivityLevel;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.Gender;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.domain.StatPeriod;
import com.example.demo.walk.domain.Walk;
import com.example.demo.walk.dto.WalkCalendarResponse;
import com.example.demo.walk.dto.WalkStatisticsResponse;
import com.example.demo.walk.repository.WalkRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 산책 통계/캘린더 집계 검증.
 *
 * <p>명세(docs/06-api-spec.md "산책 통계")의 예시값을 기준으로 작성한다:
 * WEEK 기준 totalWalks=5, totalMinutes=220, avgDuration=44, achievementRate=71.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class WalkStatisticsServiceTest {

    private static final long OWNER_ID = 1L;
    private static final long OTHER_ID = 99L;

    @Autowired
    private WalkStatisticsService walkStatisticsService;

    @Autowired
    private DogRepository dogRepository;

    @Autowired
    private WalkRepository walkRepository;

    @Test
    void 주간_통계가_명세_예시값과_일치한다() {
        Dog dog = saveDog(OWNER_ID);
        // 이번 주 월~금 5일에 산책 1건씩 (분: 40·45·50·45·40 = 220, 거리: 2.5·2.5·2.5·2.4·2.4 = 12.3)
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        saveWalk(dog, monday, 40, "2.5");
        saveWalk(dog, monday.plusDays(1), 45, "2.5");
        saveWalk(dog, monday.plusDays(2), 50, "2.5");
        saveWalk(dog, monday.plusDays(3), 45, "2.4");
        saveWalk(dog, monday.plusDays(4), 40, "2.4");

        WalkStatisticsResponse res =
                walkStatisticsService.statistics(OWNER_ID, dog.getId(), StatPeriod.WEEK);

        assertThat(res.period()).isEqualTo("WEEK");
        assertThat(res.totalWalks()).isEqualTo(5);
        assertThat(res.totalMinutes()).isEqualTo(220);
        assertThat(res.totalDistance()).isEqualByComparingTo("12.3");
        assertThat(res.avgDuration()).isEqualTo(44);
        assertThat(res.achievementRate()).isEqualTo(71); // 산책 5일 / 7일 = 71%
        assertThat(res.dailyBreakdown()).hasSize(7);     // 빈 날(토·일) 포함 7칸
        assertThat(res.dailyBreakdown())
                .filteredOn(d -> d.count() > 0)
                .hasSize(5);
    }

    @Test
    void 기록_없는_기간은_0으로_안전응답한다() {
        Dog dog = saveDog(OWNER_ID);

        WalkStatisticsResponse res =
                walkStatisticsService.statistics(OWNER_ID, dog.getId(), StatPeriod.DAY);

        assertThat(res.totalWalks()).isZero();
        assertThat(res.totalMinutes()).isZero();
        assertThat(res.totalDistance()).isEqualByComparingTo("0");
        assertThat(res.avgDuration()).isZero();      // 0으로 나누지 않음
        assertThat(res.achievementRate()).isZero();
        assertThat(res.dailyBreakdown()).hasSize(1); // DAY = 오늘 1칸
        assertThat(res.dailyBreakdown().get(0).count()).isZero();
    }

    @Test
    void 캘린더는_산책있는_날짜만_반환한다() {
        Dog dog = saveDog(OWNER_ID);
        LocalDate first = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        saveWalk(dog, first.plusDays(2), 30, "1.0");
        saveWalk(dog, first.plusDays(2), 20, "0.5"); // 같은 날 2건 → count 2, minutes 50
        saveWalk(dog, first.plusDays(9), 60, "3.0");

        WalkCalendarResponse res = walkStatisticsService.calendar(
                OWNER_ID, dog.getId(), first.getYear(), first.getMonthValue());

        assertThat(res.year()).isEqualTo(first.getYear());
        assertThat(res.month()).isEqualTo(first.getMonthValue());
        assertThat(res.days()).hasSize(2); // 산책 있는 날만
        assertThat(res.days())
                .filteredOn(d -> d.date().equals(first.plusDays(2)))
                .singleElement()
                .satisfies(d -> {
                    assertThat(d.count()).isEqualTo(2);
                    assertThat(d.minutes()).isEqualTo(50);
                });
    }

    @Test
    void 남의_반려견_통계_조회시_403() {
        Dog dog = saveDog(OWNER_ID);

        assertThatThrownBy(() ->
                walkStatisticsService.statistics(OTHER_ID, dog.getId(), StatPeriod.WEEK))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_YOUR_DOG);
    }

    private Dog saveDog(long userId) {
        Dog dog = Dog.create(
                userId, null, "초코", LocalDate.of(2022, 1, 1), BigDecimal.valueOf(5.0),
                Gender.M, true, false, ActivityLevel.MEDIUM, null, null, null);
        return dogRepository.save(dog);
    }

    /** 종료된 산책을 특정 날짜·시간·거리로 저장한다 (집계 검증용 고정 픽스처). */
    private void saveWalk(Dog dog, LocalDate date, int durationMinutes, String distanceKm) {
        LocalDateTime start = date.atTime(10, 0);
        Walk walk = Walk.builder()
                .userId(dog.getUserId())
                .dog(dog)
                .startTime(start)
                .build();
        ReflectionTestUtils.setField(walk, "endTime", start.plusMinutes(durationMinutes));
        ReflectionTestUtils.setField(walk, "durationMinutes", durationMinutes);
        ReflectionTestUtils.setField(walk, "distanceKm", new BigDecimal(distanceKm));
        walkRepository.save(walk);
    }
}
