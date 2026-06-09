package com.example.demo.walk.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 산책 시작 요청. {@code POST /api/walks/start}.
 */
public record WalkStartRequest(
        @NotNull
        Long dogId
) {}
