package com.example.demo.user.dto;

import com.example.demo.community.entity.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyCommentResponse {

    private Long commentId;

    private Long postId;

    private String postTitle;

    private String content;

    private LocalDateTime createdAt;


    public static MyCommentResponse from(
            Comment comment
    ) {

        return MyCommentResponse.builder()
                .commentId(comment.getId())
                .postId(comment.getPost().getId())
                .postTitle(comment.getPost().getTitle())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
