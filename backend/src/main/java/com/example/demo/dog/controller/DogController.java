package com.example.demo.dog.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.dog.dto.DogCreateRequest;
import com.example.demo.dog.dto.DogResponse;
import com.example.demo.dog.dto.DogUpdateRequest;
import com.example.demo.dog.service.DogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 반려견 CRUD API.
 *
 * <p>인증된 사용자만 접근 가능. JwtAuthenticationFilter 가 SecurityContext 에 넣어둔
 * {@link UserDetails}(username = userId 문자열) 를 {@link AuthenticationPrincipal} 로 받아
 * 호출자 userId 를 추출한다. SecurityConfig 의 {@code .anyRequest().authenticated()} 가
 * /api/dogs/** 인증을 강제하므로 컨트롤러에서 null/형식 검사만 방어한다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Dog (반려견)" 섹션.
 */
@RestController
@RequestMapping("/api/dogs")
@RequiredArgsConstructor
public class DogController {

    private final DogService dogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DogResponse>>> list(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(dogService.findMyDogs(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DogResponse>> register(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DogCreateRequest request
    ) {
        Long userId = resolveUserId(userDetails);
        DogResponse response = dogService.register(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{dogId}")
    public ResponseEntity<ApiResponse<DogResponse>> detail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long dogId
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(dogService.findOne(userId, dogId)));
    }

    @PatchMapping("/{dogId}")
    public ResponseEntity<ApiResponse<DogResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long dogId,
            @Valid @RequestBody DogUpdateRequest request
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(dogService.update(userId, dogId, request)));
    }

    @DeleteMapping("/{dogId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long dogId
    ) {
        Long userId = resolveUserId(userDetails);
        dogService.delete(userId, dogId);
        return ResponseEntity.noContent().build();
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        try {
            return Long.parseLong(userDetails.getUsername());
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
