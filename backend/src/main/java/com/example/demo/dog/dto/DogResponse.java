package com.example.demo.dog.dto;

import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.Gender;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;

/**
 * 반려견 상세/목록/등록·수정 응답 공용 DTO.
 *
 * <p>{@code age} 는 {@code birthDate} 기반 만 나이를 계산해서 채운다 (없으면 null).
 * {@code activityLevel} 은 한글 라벨 그대로 노출.
 */
public record DogResponse(
        Long dogId,
        String name,
        BreedSummary breed,
        LocalDate birthDate,
        Integer age,
        BigDecimal weight,
        Gender gender,
        boolean isNeutered,
        String activityLevel,
        String healthNotes,
        String profileImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DogResponse from(Dog dog) {
        return new DogResponse(
                dog.getId(),
                dog.getName(),
                BreedSummary.from(dog.getBreed()),
                dog.getBirthDate(),
                calculateAge(dog.getBirthDate()),
                dog.getWeight(),
                dog.getGender(),
                dog.isNeutered(),
                dog.getActivityLevel() == null ? null : dog.getActivityLevel().getLabel(),
                dog.getHealthNotes(),
                dog.getProfileImageUrl(),
                dog.getCreatedAt(),
                dog.getUpdatedAt()
        );
    }

    private static Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
