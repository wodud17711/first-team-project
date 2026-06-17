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
    void 주간_통계에_직전주_요약이_포함된다() {
        Dog dog = saveDog(OWNER_ID);
        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate lastMonday = thisMonday.minusWeeks(1);

        // 이번 주: 2건 (30+50=80분)
        saveWalk(dog, thisMonday, 30, "1.5");
        saveWalk(dog, thisMonday.plusDays(2), 50, "2.5");
        // 지난 주: 3건 (40+40+60=140분, 3일 산책 → 3/7=43%, 평균 47)
        saveWalk(dog, lastMonday, 40, "2.0");
        saveWalk(dog, lastMonday.plusDays(1), 40, "2.0");
        saveWalk(dog, lastMonday.plusDays(3), 60, "3.0");

        WalkStatisticsResponse res =
                walkStatisticsService.statistics(OWNER_ID, dog.getId(), StatPeriod.WEEK);

        // 현재 구간은 직전 구간 데이터에 오염되지 않는다
        assertThat(res.totalWalks()).isEqualTo(2);
        assertThat(res.totalMinutes()).isEqualTo(80);

        // 직전 주 요약
        assertThat(res.previous()).isNotNull();
        assertThat(res.previous().totalWalks()).isEqualTo(3);
        assertThat(res.previous().totalMinutes()).isEqualTo(140);
        assertThat(res.previous().totalDistance()).isEqualByComparingTo("7.0");
        assertThat(res.previous().avgDuration()).isEqualTo(47); // 140/3 반올림
        assertThat(res.previous().achievementRate()).isEqualTo(43); // 3일/7일
    }

    @Test
    void 월간_통계에_직전달_요약이_포함된다() {
        Dog dog = saveDog(OWNER_ID);
        LocalDate thisFirst = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        LocalDate lastMonthDay = thisFirst.minusMonths(1).plusDays(4); // 지난달 5일

        saveWalk(dog, thisFirst.plusDays(1), 30, "1.0"); // 이번 달 1건
        saveWalk(dog, lastMonthDay, 25, "1.2");          // 지난 달 2건
        saveWalk(dog, lastMonthDay.plusDays(1), 35, "1.8");

        WalkStatisticsResponse res =
                walkStatisticsService.statistics(OWNER_ID, dog.getId(), StatPeriod.MONTH);

        assertThat(res.totalWalks()).isEqualTo(1);
        assertThat(res.previous()).isNotNull();
        assertThat(res.previous().totalWalks()).isEqualTo(2);
        assertThat(res.previous().totalMinutes()).isEqualTo(60);
        assertThat(res.previous().totalDistance()).isEqualByComparingTo("3.0");
    }

    @Test
    void 직전_구간_기록이_없으면_previous_는_0이다() {
        Dog dog = saveDog(OWNER_ID);
        LocalDate thisMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        saveWalk(dog, thisMonday, 30, "1.5"); // 이번 주만 기록, 지난 주 없음

        WalkStatisticsResponse res =
                walkStatisticsService.statistics(OWNER_ID, dog.getId(), StatPeriod.WEEK);

        assertThat(res.previous()).isNotNull();
        assertThat(res.previous().totalWalks()).isZero();
        assertThat(res.previous().totalMinutes()).isZero();
        assertThat(res.previous().totalDistance()).isEqualByComparingTo("0");
        assertThat(res.previous().avgDuration()).isZero();      // 0으로 나누지 않음
        assertThat(res.previous().achievementRate()).isZero();
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
