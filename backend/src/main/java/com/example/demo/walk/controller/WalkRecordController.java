package com.example.demo.walk.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.walk.dto.WalkEndRequest;
import com.example.demo.walk.dto.WalkResponse;
import com.example.demo.walk.dto.WalkStartRequest;
import com.example.demo.walk.service.WalkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 산책 기록 API (시작/종료/이력).
 *
 * <p>산책 위험도 점수는 {@code /api/walk} (단수, {@link WalkController}) 가 담당하고,
 * 산책 기록은 {@code /api/walks} (복수) 로 분리한다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Walk (산책 기록)" 섹션.
 */
@RestController
@RequestMapping("/api/walks")
@RequiredArgsConstructor
public class WalkRecordController {

    private final WalkService walkService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<WalkResponse>> start(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WalkStartRequest request
    ) {
        Long userId = resolveUserId(userDetails);
        WalkResponse response = walkService.start(userId, request.dogId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/{walkId}/end")
    public ResponseEntity<ApiResponse<WalkResponse>> end(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long walkId,
            @Valid @RequestBody WalkEndRequest request
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(walkService.end(userId, walkId, request)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<WalkResponse>>> history(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long dogId
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(walkService.history(userId, dogId)));
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
