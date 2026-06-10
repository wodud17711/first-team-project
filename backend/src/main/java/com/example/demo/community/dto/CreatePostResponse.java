package com.example.demo.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CreatePostResponse {

    private Long postId;

    private String category;

    private String subTag;

    private String title;

    private LocalDateTime createdAt;
}
