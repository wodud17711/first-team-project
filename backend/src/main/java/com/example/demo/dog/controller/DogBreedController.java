package com.example.demo.dog.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.dog.dto.BreedResponse;
import com.example.demo.dog.service.DogBreedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 견종 마스터 조회 API. 드롭다운/검색용으로 인증 없이 접근 가능하다.
 * API 명세: {@code docs/06-api-spec.md} - "Breed (견종 마스터)" 섹션.
 */
@RestController
@RequestMapping("/api/breeds")
@RequiredArgsConstructor
public class DogBreedController {

    private final DogBreedService dogBreedService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BreedResponse>>> search(
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.success(dogBreedService.search(keyword)));
    }

    @GetMapping("/{breedId}")
    public ResponseEntity<ApiResponse<BreedResponse>> detail(@PathVariable Long breedId) {
        return ResponseEntity.ok(ApiResponse.success(dogBreedService.findOne(breedId)));
    }
}
