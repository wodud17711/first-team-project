package com.example.demo.walk.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.walk.dto.WalkScoreResponse;
import com.example.demo.walk.service.WalkScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/walk")
@RequiredArgsConstructor
public class WalkController {

    private final WalkScoreService walkScoreService;

    @GetMapping("/score")
    public ResponseEntity<ApiResponse<WalkScoreResponse>> getWalkScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long dogId
    ) {

        Long userId = resolveUserId(userDetails);

        WalkScoreResponse response =
                walkScoreService.calculateScore(userId, dogId);

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
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