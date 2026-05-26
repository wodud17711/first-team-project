package com.example.demo.dog.dto;

import com.example.demo.dog.entity.DogBreed;

import java.math.BigDecimal;

/**
 * 견종 상세/목록 응답. {@code GET /api/breeds*} 에서 사용한다.
 *
 * <p>{@code requiredActivity} 는 enum 코드가 아닌 DB 한글 라벨("저"/"중"/"고") 그대로 노출한다 —
 * API 명세 v3.1 이 한글 enum 노출을 명시.
 */
public record BreedResponse(
        Long breedId,
        String nameKr,
        String nameEn,
        String size,
        BigDecimal avgWeightMin,
        BigDecimal avgWeightMax,
        String requiredActivity,
        String coatType,
        Integer avgLifespan,
        boolean isBrachycephalic,
        Integer heatTolerance,
        Integer coldTolerance
) {
    public static BreedResponse from(DogBreed breed) {
        return new BreedResponse(
                breed.getId(),
                breed.getNameKr(),
                breed.getNameEn(),
                breed.getSize(),
                breed.getAvgWeightMin(),
                breed.getAvgWeightMax(),
                breed.getRequiredActivity() == null ? null : breed.getRequiredActivity().getLabel(),
                breed.getCoatType(),
                breed.getAvgLifespan(),
                breed.isBrachycephalic(),
                breed.getHeatTolerance(),
                breed.getColdTolerance()
        );
    }
}
