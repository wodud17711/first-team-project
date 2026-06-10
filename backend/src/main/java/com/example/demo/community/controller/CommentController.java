package com.example.demo.community.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.CommentResponse;
import com.example.demo.community.dto.CreateCommentRequest;
import com.example.demo.community.dto.UpdateCommentRequest;
import com.example.demo.community.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    /**
     * 댓글 목록 조회 (대댓글 포함)
     * GET /api/posts/{postId}/comments
     */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = resolveUserId(userDetails);

        return ResponseEntity.ok(
                ApiResponse.success(
                        commentService.getComments(postId, userId)
                )
        );
    }

    /**
     * 댓글 작성 (대댓글 포함)
     * POST /api/posts/{postId}/comments
     */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<Long>> createComment(
            @PathVariable Long postId,
            @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = resolveUserId(userDetails);

        Long commentId = commentService.createComment(postId, request, userId);

        return ResponseEntity.ok(
                ApiResponse.success(commentId, "댓글 작성 성공")
        );
    }

    /**
     * 댓글 수정
     * PATCH /api/comments/{commentId}
     */
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @PathVariable Long commentId,
            @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = resolveUserId(userDetails);

        commentService.updateComment(commentId, request, userId);

        return ResponseEntity.ok(
                ApiResponse.success(null, "댓글 수정 성공")
        );
    }

    /**
     * 댓글 삭제
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        Long userId = resolveUserId(userDetails);

        commentService.deleteComment(commentId, userId);

        return ResponseEntity.ok(
                ApiResponse.success(null, "댓글 삭제 성공")
        );
    }

    /**
     * userId 파싱 (AuthController/UserController와 동일 패턴 유지)
     */
    private Long resolveUserId(UserDetails userDetails) {
        try {
            return Long.parseLong(userDetails.getUsername());
        } catch (Exception e) {
            throw new IllegalArgumentException("UNAUTHORIZED");
        }
    }
}