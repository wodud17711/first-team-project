package com.example.demo.walk.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.walk.dto.OptimalTimeResponse;
import com.example.demo.walk.service.WalkOptimalTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/walk")
@RequiredArgsConstructor
public class WalkOptimalTimeController {

    private final WalkOptimalTimeService optimalTimeService;

    @GetMapping("/optimal-time")
    public ResponseEntity<ApiResponse<OptimalTimeResponse>> getOptimalTime(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long dogId
    ) {

        Long userId = Long.parseLong(userDetails.getUsername());

        OptimalTimeResponse response =
                optimalTimeService.calculate(userId, dogId);

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
    }
}
