package com.example.demo.user.dto;

import com.example.demo.user.entity.User;

import java.time.LocalDateTime;

/**
 * 내 정보 조회/수정 응답 DTO.
 *
 * <p>password 와 deletedAt 같은 민감/내부 필드는 노출하지 않는다.
 * email 은 본인 확인용으로 포함하되, 닉네임/프로필 변경 시 변경 대상은 아님.
 */
public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String profileImageUrl,
        String role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
