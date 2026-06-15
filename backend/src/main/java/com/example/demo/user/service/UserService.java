package com.example.demo.user.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.dto.PasswordChangeRequest;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.dto.UserUpdateRequest;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.RefreshTokenRepository;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

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
    public UserResponse updateMyInfo(
            Long userId,
            UserUpdateRequest request
    ) {

        User user = findUserOrThrow(userId);

        if (request.nickname() != null
                && !request.nickname().equals(user.getNickname())) {

            if (userRepository.existsByNickname(request.nickname())) {
                throw new BusinessException(
                        ErrorCode.NICKNAME_DUPLICATED
                );
            }

            user.setNickname(request.nickname());
        }

        if (request.profileImageUrl() != null) {
            user.setProfileImageUrl(request.profileImageUrl());
        }

        if (request.guardianLevel() != null) {
            user.setGuardianLevel(
                    request.guardianLevel()
            );
        }

        return UserResponse.from(user);
    }

    // =========================
    // 비밀번호 변경
    // =========================

    @Transactional
    public void changePassword(
            Long userId,
            PasswordChangeRequest request
    ) {

        User user = findUserOrThrow(userId);

        // 현재 비밀번호 검증
        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPassword()
        )) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT
            );
        }


        // 기존 비밀번호와 동일한 새 비밀번호 차단
        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPassword()
        )) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT
            );
        }


        user.setPassword(
                passwordEncoder.encode(
                        request.newPassword()
                )
        );


        // 비밀번호 변경 후 기존 refresh token 폐기
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    /**
     * 회원 탈퇴 (soft delete).
     *
     * <p>{@code deleted_at} 에 현재 시각을 박고, 해당 유저의 모든 RT 를 즉시 삭제한다.
     * 이후 {@code User @SQLRestriction("deleted_at IS NULL")} 덕분에 모든 find/exists
     * 조회에서 자동 제외 — 재가입 가능, 잔여 토큰으로 로그인 시도해도 USER_NOT_FOUND.
     *
     * <p>호출자(컨트롤러)는 응답에서 RT 쿠키를 만료시켜야 클라이언트 측 정리도 완결.
     *
     * @throws BusinessException USER_NOT_FOUND — 토큰 유효하지만 유저 사라진 비정상 케이스
     */
    @Transactional
    public void withdraw(
            Long userId,
            String password
    ) {

        User user = findUserOrThrow(userId);


        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT
            );
        }


        user.setDeletedAt(LocalDateTime.now());

        refreshTokenRepository.deleteByUser_Id(userId);
    }

    // =========================
    // 내부 헬퍼
    // =========================
    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }


}
