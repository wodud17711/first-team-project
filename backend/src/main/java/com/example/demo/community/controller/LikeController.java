package com.example.demo.community.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.LikeResponse;
import com.example.demo.community.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{postId}/likes")
    public ResponseEntity<ApiResponse<LikeResponse>> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId =
                Long.parseLong(
                        userDetails.getUsername()
                );

        LikeResponse result =
                likeService.toggleLike(
                        postId,
                        userId
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        result
                )
        );
    }
}
