package com.example.demo.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LikeResponse {

    private Long postId;

    private Integer likeCount;

    private boolean liked;
}
