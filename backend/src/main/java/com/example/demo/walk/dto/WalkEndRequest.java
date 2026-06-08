package com.example.demo.walk.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

/**
 * 산책 종료 요청. {@code POST /api/walks/{walkId}/end}.
 *
 * <p>모든 필드 선택. 거리(km)는 수동 입력/생략 (실시간 GPS 는 Phase 3).
 * {@code distanceKm} 는 DB DECIMAL(5,2) 범위(0~999.99).
 */
public record WalkEndRequest(
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "999.99")
        BigDecimal distanceKm,

        String memo,

        String userFeedback
) {}
