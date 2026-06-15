package com.example.demo.walk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 산책 통계 응답.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "산책 통계" 섹션.
 *
 * @param period           집계 기간 (DAY / WEEK / MONTH)
 * @param totalWalks       구간 내 산책 횟수
 * @param totalMinutes     구간 내 총 산책 시간(분)
 * @param totalDistance    구간 내 총 거리(km)
 * @param avgDuration      산책 1회 평균 시간(분, 반올림). 산책이 없으면 0
 * @param achievementRate  달성률(%) = 산책한 날 수 / 구간 일수 × 100 (반올림)
 * @param dailyBreakdown   구간 내 모든 날짜의 일별 집계 (산책 없는 날은 0으로 채움)
 */
public record WalkStatisticsResponse(
        String period,
        long totalWalks,
        long totalMinutes,
        BigDecimal totalDistance,
        int avgDuration,
        int achievementRate,
        List<DailyStat> dailyBreakdown
) {
    /** 일별 집계 한 칸. */
    public record DailyStat(LocalDate date, long minutes, long count) {
    }
}
