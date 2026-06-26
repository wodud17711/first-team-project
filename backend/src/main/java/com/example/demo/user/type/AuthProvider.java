package com.example.demo.user.type;

/**
 * 인증 제공자.
 * - LOCAL: 이메일/비밀번호 가입 (provider_id = null)
 * - KAKAO/GOOGLE: 소셜 로그인 (provider_id = 소셜 고유 ID, password = null)
 */
public enum AuthProvider {
    LOCAL,
    KAKAO,
    GOOGLE
}
