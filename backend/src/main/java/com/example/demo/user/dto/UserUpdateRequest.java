package com.example.demo.user.dto;

import com.example.demo.user.type.GuardianLevel;
import jakarta.validation.constraints.Size;

/**
 * 내 정보 수정 요청 (PATCH /api/users/me).
 *
 * <p>{@code null} 인 필드는 변경하지 않는다 (부분 수정).
 * 값이 들어온 필드만 검증·반영한다.
 *
 * <p>수정 가능 항목: 닉네임, 프로필 이미지, 보호자 연차.
 * email 과 password 는 별도 엔드포인트에서 변경한다.
 */
public record UserUpdateRequest(

        @Size(
                min = 2,
                max = 20,
                message = "닉네임은 2~20자여야 합니다."
        )
        String nickname,

        @Size(
                max = 500,
                message = "프로필 이미지 URL은 500자 이하여야 합니다."
        )
        String profileImageUrl,

        GuardianLevel guardianLevel

) {
}