package com.example.demo.community.dto;

import com.example.demo.community.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostResponse {

    private Long postId;

    private Long categoryId;

    private String categoryName;

    private String subTag;

    private String title;

    private String content;

    private String author;

    private Integer viewCount;

    private Integer likeCount;

    private Integer commentCount;

    private LocalDateTime createdAt;

    public static PostResponse from(Post post) {

        return PostResponse.builder()
                .postId(post.getId())
                .categoryId(post.getCategory().getId())
                .categoryName(post.getCategory().getName())
                .subTag(post.getSubTag())
                .title(post.getTitle())
                .content(post.getContent())
                .author(post.getUser().getNickname())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
