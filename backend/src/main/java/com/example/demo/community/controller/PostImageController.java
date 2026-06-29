package com.example.demo.community.controller;

import com.example.demo.auth.security.CustomUserPrincipal;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.CreatePostImageRequest;
import com.example.demo.community.service.PostImageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostImageController {

    private final PostImageService postImageService;

    @PostMapping("/{postId}/images")
    public ResponseEntity<ApiResponse<Long>> addImage(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody CreatePostImageRequest request
    ) {
        // 인증 정보가 없을 때 → 401
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Long userId = principal.getUserId();

        // 잘못된 입력값 → 400
        if (request.imageUrl() == null || request.imageUrl().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        // 확장자/용량 제한 검증 (예시)
        if (!request.imageUrl().endsWith(".jpg") &&
                !request.imageUrl().endsWith(".png") &&
                !request.imageUrl().endsWith(".jpeg") &&
                !request.imageUrl().endsWith(".webp")) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }


        Long imageId = postImageService.addImage(postId, userId, request);

        // 저장 실패 → 500
        if (imageId == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        return ResponseEntity.ok(ApiResponse.success(imageId));
    }
}
