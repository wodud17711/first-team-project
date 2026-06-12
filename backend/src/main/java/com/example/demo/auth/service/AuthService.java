package com.example.demo.auth.service;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.security.JwtProvider;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.entity.RefreshToken;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.RefreshTokenRepository;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.type.GuardianLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    // =========================
    // 회원가입
    // =========================
    public AuthResponse signup(
            String email,
            String password,
            String nickname,
            GuardianLevel guardianLevel
    ) {

        // 대소문자/공백 차이로 동일 이메일 중복 가입되는 문제 차단.
        String normalizedEmail = normalizeEmail(email);

        // 닉네임 공백 트릭(시각적 중복) 차단 — 모든 공백(전각 포함) 제거.
        String normalizedNickname = normalizeNickname(nickname);

        // 정규화 후 길이 미달(공백만 입력 등) 또는 초과 차단.
        if (normalizedNickname == null
                || normalizedNickname.length() < 2
                || normalizedNickname.length() > 20) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }

        if (userRepository.existsByNickname(normalizedNickname)) {
            throw new BusinessException(
                    ErrorCode.NICKNAME_DUPLICATED
            );
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(normalizedNickname);
        user.setRole("USER");
        user.setGuardianLevel(guardianLevel);

        userRepository.save(user);

        return issueTokens(user);
    }

    // =========================
    // 로그인
    // =========================
    // ⚠️ readOnly 제거: issueTokens 가 RT save/delete 쓰기 동작을 함. readOnly 면 Hibernate FlushMode 변경으로 쓰기 누락 우려.
    public AuthResponse login(String email, String password) {

        // 보안: 이메일이 없을 때와 비번이 틀릴 때 응답을 동일하게 → account enumeration 차단 (OWASP).
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.INVALID_CREDENTIALS
                        ));

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {
            throw new BusinessException(
                    ErrorCode.INVALID_CREDENTIALS
            );
        }

        return issueTokens(user);
    }

    // =========================
    // refresh
    // =========================
    // ⚠️ readOnly 제거: 만료 토큰 발견 시 delete 쓰기 동작이 일어남.
    // readOnly 트랜잭션은 Hibernate FlushMode 가 MANUAL 로 잡혀 쓰기가 누락될 수 있어
    // 클래스 @Transactional (쓰기) 을 그대로 적용한다.
    public String refresh(String refreshToken) {

        if (refreshToken == null) {
            throw new BusinessException(
                    ErrorCode.INVALID_TOKEN
            );
        }

        RefreshToken token =
                refreshTokenRepository.findByTokenHash(
                                hash(refreshToken)
                        )
                        .orElseThrow(() ->
                                new BusinessException(
                                        ErrorCode.INVALID_TOKEN
                                ));

        if (token.isExpired()) {

            refreshTokenRepository.delete(token);

            throw new BusinessException(
                    ErrorCode.EXPIRED_REFRESH_TOKEN
            );
        }

        return jwtProvider.generateAccessToken(
                token.getUser().getId()
        );
    }

    // =========================
    // logout
    // =========================
    public void logout(String refreshToken) {

        if (refreshToken == null) {
            return;
        }

        refreshTokenRepository.deleteByTokenHash(
                hash(refreshToken)
        );
    }

    // =========================
    // 내부 로직
    // =========================
    private AuthResponse issueTokens(User user) {

        String accessToken =
                jwtProvider.generateAccessToken(user.getId());

        String refreshToken =
                generateRefreshToken();

        refreshTokenRepository.deleteByUser_Id(user.getId());

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(refreshToken))
                .expiresAt(
                        System.currentTimeMillis()
                                + 1000L * 60 * 60 * 24 * 14
                )
                .build();

        refreshTokenRepository.save(rt);

        return new AuthResponse(
                accessToken,
                refreshToken
        );
    }

    private String normalizeEmail(String email) {

        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeNickname(String nickname) {

        // (?U) = UNICODE_CHARACTER_CLASS — \s 가 전각 공백(　) 등 유니코드 공백까지 매칭.
        return nickname == null ? null : nickname.replaceAll("(?U)\\s+", "");
    }

    private String generateRefreshToken() {

        return java.util.UUID.randomUUID().toString()
                + java.util.UUID.randomUUID();
    }

    private String hash(String value) {

        try {

            var md =
                    java.security.MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] digest =
                    md.digest(value.getBytes());

            return java.util.HexFormat.of()
                    .formatHex(digest);

        } catch (Exception e) {

            throw new RuntimeException(e);
        }
    }
}