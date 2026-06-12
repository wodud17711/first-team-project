package com.example.demo.community.dto;

import com.example.demo.community.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostSummaryResponse {

    private Long postId;

    private String category;

    private String subTag;

    private String title;

    private String author;

    private Integer likeCount;

    private boolean liked;

    private Integer viewCount;

    private Integer commentCount;

    private String thumbnailUrl;

    private LocalDateTime createdAt;

    public static PostSummaryResponse from(
            Post post,
            boolean liked
    ) {

        return PostSummaryResponse.builder()
                .postId(post.getId())
                .category(post.getCategory().getName())
                .subTag(post.getSubTag())
                .title(post.getTitle())
                .author(post.getUser().getNickname())
                .likeCount(post.getLikeCount())
                .viewCount(post.getViewCount())
                .commentCount(post.getCommentCount())
                .thumbnailUrl(null)
                .liked(liked)
                .createdAt(post.getCreatedAt())
                .build();
    }
}