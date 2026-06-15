package com.example.demo.community.dto;

import com.example.demo.community.entity.PostImage;

import lombok.Builder;

@Builder
public record PostImageResponse(

        Long imageId,

        String imageUrl

) {

    public static PostImageResponse from(
            PostImage image
    ) {

        return PostImageResponse.builder()
                .imageId(image.getId())
                .imageUrl(image.getImageUrl())
                .build();
    }
}