package com.example.demo.auth.dto;

/**
 * 소셜 제공자에서 받은 사용자 정보 (provider 공통 형태).
 * - providerId: 소셜 고유 ID (필수)
 * - nickname/profileImageUrl: 제공자가 안 줄 수 있음(null 가능)
 */
public record OAuthUserInfo(
        String providerId,
        String nickname,
        String profileImageUrl
) {
}
