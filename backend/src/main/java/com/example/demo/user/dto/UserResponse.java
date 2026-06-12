package com.example.demo.user.dto;

import com.example.demo.user.entity.User;
import com.example.demo.user.type.GuardianLevel;

import java.time.LocalDateTime;

public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String profileImageUrl,
        String role,
        GuardianLevel guardianLevel,
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
                user.getGuardianLevel(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}