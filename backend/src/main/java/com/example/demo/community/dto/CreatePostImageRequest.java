package com.example.demo.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 게시글 이미지 등록 요청 DTO
 * - URL은 필수
 * - 최대 500자
 * - 허용 확장자: jpg, jpeg, png, webp
 */
public record CreatePostImageRequest(

        @NotBlank(message = "이미지 URL은 필수입니다.")
        @Size(max = 500, message = "이미지 URL은 500자 이하여야 합니다.")
        @Pattern(
                regexp = ".*\\.(jpg|jpeg|png|webp)$",
                message = "이미지 확장자는 jpg, jpeg, png, webp만 허용됩니다."
        )
        String imageUrl

) {
}
