package com.example.demo.walk.domain;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * 산책 통계 집계 기간.
 *
 * <p>모두 <b>캘린더 정렬</b> 기준이다 (rolling 아님):
 * <ul>
 *   <li>{@link #DAY} : 기준일 당일</li>
 *   <li>{@link #WEEK} : 기준일이 속한 주의 월~일 (ISO, 월요일 시작)</li>
 *   <li>{@link #MONTH} : 기준일이 속한 달의 1일~말일</li>
 * </ul>
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "산책 통계" 섹션.
 */
public enum StatPeriod {
    DAY,
    WEEK,
    MONTH;

    /** 집계 구간 (양끝 포함). */
    public record Range(LocalDate startInclusive, LocalDate endInclusive) {
        /** 구간 일수 (양끝 포함). 달성률 분모로 사용. */
        public long days() {
            return java.time.temporal.ChronoUnit.DAYS.between(startInclusive, endInclusive) + 1;
        }
    }

    /**
     * 쿼리 파라미터 문자열을 {@link StatPeriod} 로 변환한다.
     * 대소문자를 구분하지 않으며, 정의되지 않은 값이면 {@link ErrorCode#INVALID_INPUT}(400).
     */
    public static StatPeriod from(String raw) {
        if (raw == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        try {
            return StatPeriod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    /**
     * 기준일 {@code base} 를 이 기간 단위만큼 이동한 날짜를 돌려준다.
     * 직전 구간 조회 시 {@code shift(today, -1)} 로 한 구간 전의 기준일을 얻는다.
     * (DAY=일, WEEK=주, MONTH=월 단위 이동)
     */
    public LocalDate shift(LocalDate base, long periods) {
        return switch (this) {
            case DAY -> base.plusDays(periods);
            case WEEK -> base.plusWeeks(periods);
            case MONTH -> base.plusMonths(periods);
        };
    }

    /** 기준일 {@code base} 를 포함하는 캘린더 정렬 구간을 계산한다. */
    public Range range(LocalDate base) {
        return switch (this) {
            case DAY -> new Range(base, base);
            case WEEK -> new Range(
                    base.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                    base.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)));
            case MONTH -> new Range(
                    base.with(TemporalAdjusters.firstDayOfMonth()),
                    base.with(TemporalAdjusters.lastDayOfMonth()));
        };
    }
}
