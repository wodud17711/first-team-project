package com.example.demo.user.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.PostSummaryResponse;
import com.example.demo.user.dto.MyCommentResponse;
import com.example.demo.user.service.MyActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class MyActivityController {


    private final MyActivityService myActivityService;


    /**
     * 내가 작성한 게시글 목록
     *
     * GET /api/users/me/posts?page=0&size=20
     */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<PostSummaryResponse>>> getMyPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        Long userId = resolveUserId(userDetails);

        return ResponseEntity.ok(
                ApiResponse.success(
                        myActivityService.getMyPosts(
                                userId,
                                page,
                                size
                        )
                )
        );
    }


    /**
     * 내가 작성한 댓글 목록
     *
     * GET /api/users/me/comments?page=0&size=20
     */
    @GetMapping("/comments")
    public ResponseEntity<ApiResponse<Page<MyCommentResponse>>> getMyComments(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        Long userId = resolveUserId(userDetails);

        return ResponseEntity.ok(
                ApiResponse.success(
                        myActivityService.getMyComments(
                                userId,
                                page,
                                size
                        )
                )
        );
    }


    /**
     * 내가 좋아요한 게시글 목록
     *
     * GET /api/users/me/likes?page=0&size=20
     */
    @GetMapping("/likes")
    public ResponseEntity<ApiResponse<Page<PostSummaryResponse>>> getMyLikes(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        Long userId = resolveUserId(userDetails);

        return ResponseEntity.ok(
                ApiResponse.success(
                        myActivityService.getMyLikes(
                                userId,
                                page,
                                size
                        )
                )
        );
    }


    private Long resolveUserId(
            UserDetails userDetails
    ) {

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