package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.domain.StatPeriod;
import com.example.demo.walk.domain.Walk;
import com.example.demo.walk.dto.WalkCalendarResponse;
import com.example.demo.walk.dto.WalkCalendarResponse.CalendarDay;
import com.example.demo.walk.dto.WalkStatisticsResponse;
import com.example.demo.walk.dto.WalkStatisticsResponse.DailyStat;
import com.example.demo.walk.repository.WalkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * 산책 통계 / 캘린더 집계.
 *
 * <p>반려견 단위로 집계한다. 소유권은 {@link #getMyDog} 로 검증한다(위반 시 403).
 * 집계는 in-memory 스트림으로 처리한다(MVP 데이터량 기준 충분, H2/MySQL 공통 동작).
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "산책 통계" / "산책 캘린더" 섹션.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkStatisticsService {

    private final WalkRepository walkRepository;
    private final DogRepository dogRepository;

    /**
     * 반려견의 기간별 산책 통계.
     *
     * <p>기준일은 오늘({@code LocalDate.now()})이며, {@code period} 에 따라 캘린더 정렬 구간으로 집계한다.
     * 산책 횟수는 {@code start_time} 기준이고, 시간/거리 합은 미종료 산책의 {@code null} 값을 0으로 본다.
     */
    public WalkStatisticsResponse statistics(Long userId, Long dogId, StatPeriod period) {
        getMyDog(userId, dogId);

        StatPeriod.Range range = period.range(LocalDate.now());
        List<Walk> walks = walksIn(dogId, range.startInclusive(), range.endInclusive());

        // 날짜별 집계 (산책이 있는 날만 우선 모은 뒤, 빈 날은 dailyBreakdown 생성 시 0으로 채움)
        Map<LocalDate, DayAgg> byDate = aggregateByDate(walks);

        long totalWalks = walks.size();
        long totalMinutes = byDate.values().stream().mapToLong(DayAgg::minutes).sum();
        BigDecimal totalDistance = byDate.values().stream()
                .map(DayAgg::distance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int avgDuration = totalWalks == 0 ? 0 : (int) Math.round((double) totalMinutes / totalWalks);

        long walkDays = byDate.values().stream().filter(a -> a.count() > 0).count();
        int achievementRate = (int) Math.round(walkDays * 100.0 / range.days());

        List<DailyStat> breakdown = range.startInclusive()
                .datesUntil(range.endInclusive().plusDays(1))
                .map(date -> {
                    DayAgg agg = byDate.get(date);
                    return new DailyStat(date,
                            agg == null ? 0 : agg.minutes(),
                            agg == null ? 0 : agg.count());
                })
                .toList();

        return new WalkStatisticsResponse(
                period.name(), totalWalks, totalMinutes, totalDistance,
                avgDuration, achievementRate, breakdown);
    }

    /**
     * 반려견의 월별 산책 캘린더. {@code days} 는 산책이 1회 이상 있는 날짜만(희소) 담는다.
     */
    public WalkCalendarResponse calendar(Long userId, Long dogId, int year, int month) {
        getMyDog(userId, dogId);

        YearMonth ym = toYearMonth(year, month);
        List<Walk> walks = walksIn(dogId, ym.atDay(1), ym.atEndOfMonth());

        List<CalendarDay> days = aggregateByDate(walks).entrySet().stream()
                .filter(e -> e.getValue().count() > 0)
                .map(e -> new CalendarDay(e.getKey(), e.getValue().count(), e.getValue().minutes()))
                .toList();

        return new WalkCalendarResponse(year, month, days);
    }

    /** {@code [startDate 00:00, endDate+1 00:00)} 구간의 산책을 조회한다. */
    private List<Walk> walksIn(Long dogId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();
        return walkRepository
                .findByDogIdAndStartTimeGreaterThanEqualAndStartTimeLessThan(dogId, start, endExclusive);
    }

    /** 산책 목록을 시작일(LocalDate) 기준으로 묶어 일별 합계를 만든다(날짜 오름차순). */
    private Map<LocalDate, DayAgg> aggregateByDate(List<Walk> walks) {
        Map<LocalDate, DayAgg> byDate = new TreeMap<>();
        for (Walk walk : walks) {
            LocalDate date = walk.getStartTime().toLocalDate();
            long minutes = walk.getDurationMinutes() == null ? 0 : walk.getDurationMinutes();
            BigDecimal distance = walk.getDistanceKm() == null ? BigDecimal.ZERO : walk.getDistanceKm();
            byDate.merge(date, new DayAgg(1, minutes, distance), DayAgg::plus);
        }
        return byDate;
    }

    private YearMonth toYearMonth(int year, int month) {
        try {
            return YearMonth.of(year, month);
        } catch (java.time.DateTimeException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private Dog getMyDog(Long userId, Long dogId) {
        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        if (!dog.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_DOG);
        }
        return dog;
    }

    /** 하루치 누적값 (횟수·분·거리). */
    private record DayAgg(long count, long minutes, BigDecimal distance) {
        DayAgg plus(DayAgg other) {
            return new DayAgg(count + other.count, minutes + other.minutes,
                    distance.add(other.distance));
        }
    }
}
