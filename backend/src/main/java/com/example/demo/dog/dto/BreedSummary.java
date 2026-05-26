package com.example.demo.dog.dto;

import com.example.demo.dog.entity.DogBreed;

/**
 * 반려견 응답 안에 nested 로 들어가는 견종 요약.
 * 산책 위험도 계산에 필요한 핵심 컬럼만 포함한다.
 */
public record BreedSummary(
        Long breedId,
        String nameKr,
        boolean isBrachycephalic,
        Integer heatTolerance,
        Integer coldTolerance
) {
    public static BreedSummary from(DogBreed breed) {
        if (breed == null) {
            return null;
        }
        return new BreedSummary(
                breed.getId(),
                breed.getNameKr(),
                breed.isBrachycephalic(),
                breed.getHeatTolerance(),
                breed.getColdTolerance()
        );
    }
}
