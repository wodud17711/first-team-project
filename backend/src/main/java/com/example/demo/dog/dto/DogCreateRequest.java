package com.example.demo.dog.dto;

import com.example.demo.dog.entity.Gender;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 반려견 등록 요청. {@code POST /api/dogs}.
 *
 * <p>{@code activityLevel} 은 DB ENUM 한글 라벨 그대로 받는다 (저/중/고).
 * Service 에서 {@code ActivityLevel.fromLabel()} 로 변환한다.
 */
public record DogCreateRequest(
        @NotBlank
        @Size(min = 1, max = 30)
        String name,

        Long breedId,

        LocalDate birthDate,

        @DecimalMin(value = "0.1")
        @DecimalMax(value = "100.0")
        BigDecimal weight,

        Gender gender,

        Boolean isNeutered,

        @Pattern(regexp = "저|중|고", message = "activityLevel 은 저/중/고 중 하나여야 합니다")
        String activityLevel,

        String healthNotes,

        @Size(max = 500)
        String profileImageUrl,

        List<@Min(value = 0, message = "산책 시간대는 0~23 사이여야 합니다")
             @Max(value = 23, message = "산책 시간대는 0~23 사이여야 합니다") Integer> favorWalkTime,

        Boolean isMain
) {}
