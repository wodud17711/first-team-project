package com.example.demo.upload.dto;

/**
 * 이미지 업로드 응답.
 *
 * <p>{@code url} 은 정적 서빙 경로(예: {@code /uploads/2026/06/a1b2c3d4-....jpg}).
 * FE 는 이 URL 을 {@code users.profile_image_url}/{@code dogs.profile_image_url}/게시글 {@code imageUrls}
 * 등 DB 저장 필드에 그대로 사용한다(blob: 대체).
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "이미지 업로드" 섹션(v3.7).
 */
public record UploadResponse(String url) {
}
