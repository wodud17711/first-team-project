package com.example.demo.community.dto;

import com.example.demo.community.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

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

    /**
     * 작성자 프로필 이미지 URL
     */
    private String authorProfileImageUrl;

    private Integer viewCount;

    private Integer likeCount;

    private boolean liked;

    private Integer commentCount;

    private LocalDateTime createdAt;

    private String authorLevel;

    private List<PostImageResponse> images;


    public static PostResponse from(
            Post post,
            boolean liked
    ) {

        return PostResponse.builder()
                .postId(post.getId())
                .categoryId(post.getCategory().getId())
                .categoryName(post.getCategory().getName())
                .subTag(post.getSubTag())
                .title(post.getTitle())
                .content(post.getContent())
                .author(post.getUser().getNickname())
                .authorProfileImageUrl(
                        post.getUser().getProfileImageUrl()
                )
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .liked(liked)
                .createdAt(post.getCreatedAt())
                .authorLevel(
                        post.getUser().getGuardianLevel() != null
                                ? post.getUser().getGuardianLevel().name()
                                : null
                )
                .images(
                        post.getImages()
                                .stream()
                                .map(PostImageResponse::from)
                                .toList()
                )
                .build();
    }
}