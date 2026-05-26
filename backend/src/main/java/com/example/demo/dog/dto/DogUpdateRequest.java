package com.example.demo.dog.dto;

import com.example.demo.dog.entity.Gender;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 반려견 수정 요청 (PATCH). {@code null} 인 필드는 변경하지 않는다.
 * 값이 들어온 필드만 검증 어노테이션이 동작한다.
 */
public record DogUpdateRequest(
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
        String profileImageUrl
) {}
