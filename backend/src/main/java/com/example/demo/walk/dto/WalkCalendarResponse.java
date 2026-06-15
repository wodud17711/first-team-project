package com.example.demo.walk.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 월별 산책 캘린더 응답 (FE 히트맵 입력).
 *
 * <p>{@code days} 는 해당 월에서 <b>산책이 1회 이상 있는 날짜만</b> 담는다 (희소 배열).
 * 산책이 없는 날짜는 포함하지 않으며, FE 에서 0으로 채운다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "산책 캘린더" 섹션.
 *
 * @param year  조회 연도
 * @param month 조회 월 (1~12)
 * @param days  산책이 있는 날짜별 집계
 */
public record WalkCalendarResponse(
        int year,
        int month,
        List<CalendarDay> days
) {
    /**
     * 산책이 있는 하루.
     *
     * @param date    날짜
     * @param count   그 날 산책 횟수
     * @param minutes 그 날 총 산책 시간(분)
     */
    public record CalendarDay(LocalDate date, long count, long minutes) {
    }
}
