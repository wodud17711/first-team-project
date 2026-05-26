package com.example.demo.dog.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.dog.dto.DogCreateRequest;
import com.example.demo.dog.dto.DogResponse;
import com.example.demo.dog.dto.DogUpdateRequest;
import com.example.demo.dog.service.DogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 반려견 CRUD API.
 *
 * <p>인증된 사용자만 접근 가능하지만, Spring Security/JWT 통합 전이므로
 * 현재는 임시로 {@code X-User-Id} 헤더로 호출자 식별. 인증 통합 시
 * {@code @AuthenticationPrincipal} 등으로 1줄 교체한다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Dog (반려견)" 섹션.
 */
@RestController
@RequestMapping("/api/dogs")
@RequiredArgsConstructor
public class DogController {

    // TODO: Spring Security 통합 후 SecurityContextHolder/@AuthenticationPrincipal 로 교체
    private static final String USER_ID_HEADER = "X-User-Id";

    private final DogService dogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DogResponse>>> list(
            @RequestHeader(USER_ID_HEADER) Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(dogService.findMyDogs(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DogResponse>> register(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Valid @RequestBody DogCreateRequest request
    ) {
        DogResponse response = dogService.register(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{dogId}")
    public ResponseEntity<ApiResponse<DogResponse>> detail(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long dogId
    ) {
        return ResponseEntity.ok(ApiResponse.success(dogService.findOne(userId, dogId)));
    }

    @PatchMapping("/{dogId}")
    public ResponseEntity<ApiResponse<DogResponse>> update(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long dogId,
            @Valid @RequestBody DogUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dogService.update(userId, dogId, request)));
    }

    @DeleteMapping("/{dogId}")
    public ResponseEntity<Void> delete(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long dogId
    ) {
        dogService.delete(userId, dogId);
        return ResponseEntity.noContent().build();
    }
}
