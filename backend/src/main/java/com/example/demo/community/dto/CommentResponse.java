package com.example.demo.community.dto;

import com.example.demo.community.entity.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Getter
@Builder
public class CommentResponse {

    private Long commentId;

    private Long userId;

    private String author;

    private String content;

    private boolean mine;

    private LocalDateTime createdAt;

    private List<CommentResponse> replies;

    private String authorLevel;

    public static CommentResponse from(
            Comment comment,
            Long loginUserId,
            List<CommentResponse> replies
    ) {

        return CommentResponse.builder()
                .commentId(comment.getId())
                .userId(comment.getUser().getId())
                .author(comment.getUser().getNickname())
                .content(comment.getContent())
                .mine(
                        Objects.equals(
                                comment.getUser().getId(),
                                loginUserId
                        )
                )
                .createdAt(comment.getCreatedAt())
                .replies(replies)
                .build();
    }
}