package com.example.demo.walk;

import com.example.demo.common.response.ApiResponse;
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

        Long userId = Long.parseLong(
                userDetails.getUsername()
        );

        WalkScoreResult result =
                walkScoreService.calculateScore(
                        userId,
                        dogId
                );

        WalkScoreResponse response =
                WalkScoreResponse.from(result);

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
    }
}