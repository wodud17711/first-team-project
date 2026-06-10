package com.example.demo.community.dto;

import com.example.demo.community.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostSummaryResponse {

    private Long id;

    private String title;

    private String author;

    private Integer viewCount;

    private Integer commentCount;

    private LocalDateTime createdAt;

    public static PostSummaryResponse from(Post post) {

        String title = post.getTitle();

        if (post.getSubTag() != null && !post.getSubTag().isBlank()) {
            title = "[" + post.getSubTag() + "] " + title;
        }

        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(title)
                .author(post.getUser().getNickname())
                .viewCount(post.getViewCount())
                .commentCount(post.getCommentCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}