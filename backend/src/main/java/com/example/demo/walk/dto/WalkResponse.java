package com.example.demo.walk.dto;

import com.example.demo.walk.domain.Walk;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 산책 기록 응답 (시작/종료/이력 공용).
 */
public record WalkResponse(
        Long walkId,
        Long dogId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer durationMinutes,
        BigDecimal distanceKm,
        String memo,
        String userFeedback,
        boolean inProgress
) {
    public static WalkResponse from(Walk walk) {
        return new WalkResponse(
                walk.getId(),
                walk.getDog().getId(),
                walk.getStartTime(),
                walk.getEndTime(),
                walk.getDurationMinutes(),
                walk.getDistanceKm(),
                walk.getMemo(),
                walk.getUserFeedback(),
                walk.isInProgress()
        );
    }
}
