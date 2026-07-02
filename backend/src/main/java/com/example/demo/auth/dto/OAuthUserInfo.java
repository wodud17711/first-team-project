package com.example.demo.auth.dto;

/**
 * 소셜 제공자에서 받은 사용자 정보 (provider 공통 형태).
 * - providerId: 소셜 고유 ID (필수)
 * - nickname/profileImageUrl: 제공자가 안 줄 수 있음(null 가능)
 * - email: 제공자가 검증한 이메일만 담는다(구글=email_verified, 네이버=본인확인 메일).
 *   미검증/미제공이면 null — 기존 LOCAL 계정과의 자동 연동 판단에 쓰이므로 미검증 이메일 금지.
 */
public record OAuthUserInfo(
        String providerId,
        String nickname,
        String profileImageUrl,
        String email
) {
}
