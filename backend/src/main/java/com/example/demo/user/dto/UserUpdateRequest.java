package com.example.demo.user.dto;

import jakarta.validation.constraints.Size;

/**
 * 내 정보 수정 요청 (PATCH /api/users/me).
 *
 * <p>{@code null} 인 필드는 변경하지 않는다 (부분 수정). 값이 들어온 필드만 검증·반영.
 * email 과 password 는 별도 엔드포인트(추후)에서 변경. 여기서는 닉네임·프로필 이미지만.
 */
public record UserUpdateRequest(
        @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
        String nickname,

        @Size(max = 500, message = "프로필 이미지 URL은 500자 이하여야 합니다.")
        String profileImageUrl
) {}
