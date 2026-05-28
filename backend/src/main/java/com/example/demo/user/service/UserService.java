package com.example.demo.user.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.dto.UserUpdateRequest;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 도메인 비즈니스 로직.
 *
 * <p>인증 흐름은 {@code auth} 패키지에서 담당하고, 이 서비스는 인증된 사용자의 본인 정보
 * 조회·수정·탈퇴를 다룬다. 컨트롤러는 JWT 에서 추출한 userId 만 넘긴다.
 *
 * <p>탈퇴 유저는 {@code User @SQLRestriction("deleted_at IS NULL")} 덕분에 모든
 * find/exists 조회에서 자동 제외되므로, 여기서는 deleted_at 명시 처리 불필요.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 내 정보 조회.
     *
     * @param userId JWT 에서 추출한 호출자 ID
     * @return 본인 정보 (password·deletedAt 등 민감 필드 제외)
     * @throws BusinessException USER_NOT_FOUND — 토큰은 유효하지만 해당 유저가 DB 에 없거나
     *                           (예: 동시 탈퇴 후 잔여 토큰 사용) 소프트삭제로 가려진 경우
     */
    @Transactional(readOnly = true)
    public UserResponse getMyInfo(Long userId) {
        User user = findUserOrThrow(userId);
        return UserResponse.from(user);
    }

    /**
     * 내 정보 수정. PATCH 방식 — {@code null} 인 필드는 변경하지 않는다.
     *
     * <ul>
     *   <li>nickname 변경 시: 동일 값이면 skip, 다른 값이면 중복 검사 후 변경
     *   <li>profileImageUrl: null 이 아니면 그대로 반영 (빈 문자열은 "이미지 제거" 의미로 허용)
     * </ul>
     *
     * @throws BusinessException USER_NOT_FOUND (404) — 호출자 유저 자체가 사라짐
     * @throws BusinessException NICKNAME_DUPLICATED (409) — 다른 사용자가 이미 사용 중인 닉네임
     */
    @Transactional
    public UserResponse updateMyInfo(Long userId, UserUpdateRequest request) {
        User user = findUserOrThrow(userId);

        if (request.nickname() != null
                && !request.nickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new BusinessException(ErrorCode.NICKNAME_DUPLICATED);
            }
            user.setNickname(request.nickname());
        }

        if (request.profileImageUrl() != null) {
            user.setProfileImageUrl(request.profileImageUrl());
        }

        // dirty checking + @PreUpdate 가 updatedAt 자동 갱신
        return UserResponse.from(user);
    }

    // =========================
    // 내부 헬퍼
    // =========================
    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
