package com.example.demo.community.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.*;
import com.example.demo.community.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreatePostResponse>> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePostRequest request
    ) {

        Long userId = resolveUserId(userDetails);

        return ResponseEntity.ok(
                ApiResponse.success(
                        postService.createPost(
                                request,
                                userId
                        )
                )
        );
    }


    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostSummaryResponse>>> getPosts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String subTag,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = null;

        if (userDetails != null) {
            userId = Long.parseLong(
                    userDetails.getUsername()
            );
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        postService.getPosts(
                                categoryId,
                                subTag,
                                sort,
                                page,
                                size,
                                userId
                        )
                )
        );
    }


    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = null;

        if (userDetails != null) {
            userId = Long.parseLong(
                    userDetails.getUsername()
            );
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        postService.getPost(
                                postId,
                                userId
                        )
                )
        );
    }


    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdatePostRequest request
    ) {

        Long userId = resolveUserId(userDetails);

        postService.updatePost(
                postId,
                request,
                userId
        );

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }


    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = resolveUserId(userDetails);

        postService.deletePost(
                postId,
                userId
        );

        return ResponseEntity.noContent().build();
    }


    private Long resolveUserId(UserDetails userDetails) {

        if (userDetails == null) {
            throw new BusinessException(
                    ErrorCode.UNAUTHORIZED
            );
        }

        try {
            return Long.parseLong(
                    userDetails.getUsername()
            );

        } catch (NumberFormatException e) {

            throw new BusinessException(
                    ErrorCode.UNAUTHORIZED
            );
        }
    }
}