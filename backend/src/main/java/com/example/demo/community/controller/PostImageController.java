package com.example.demo.community.controller;


import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.community.dto.CreatePostImageRequest;
import com.example.demo.community.service.PostImageService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostImageController {


    private final PostImageService postImageService;



    @PostMapping("/{postId}/images")
    public ResponseEntity<ApiResponse<Long>> addImage(

            @PathVariable Long postId,

            @AuthenticationPrincipal UserDetails userDetails,

            @Valid @RequestBody CreatePostImageRequest request

    ) {


        Long userId = resolveUserId(userDetails);


        return ResponseEntity.ok(
                ApiResponse.success(
                        postImageService.addImage(
                                postId,
                                userId,
                                request
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
