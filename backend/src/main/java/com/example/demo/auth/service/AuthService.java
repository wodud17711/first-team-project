package com.example.demo.auth.service;

import com.example.demo.auth.dto.*;
import com.example.demo.auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    // 회원가입
    public AuthResponse signup(String email, String password) {

        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("EMAIL_ALREADY_EXISTS");
        }

        // 2. 유저 생성 (다른 팀원이 Entity 만들었을 것)
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        userRepository.save(user);

        // 3. 토큰 발급
        return issueTokens(user);
    }

    // 로그인
    public AuthResponse login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("INVALID_PASSWORD");
        }

        return issueTokens(user);
    }

    // refresh
    public String refresh(String refreshToken) {

        if (refreshToken == null) {
            throw new RuntimeException("INVALID_REFRESH_TOKEN");
        }

        RefreshToken token =
                refreshTokenRepository.findByTokenHash(hash(refreshToken))
                        .orElseThrow(() ->
                                new RuntimeException("INVALID_REFRESH_TOKEN"));

        if (token.isExpired()) {
            throw new RuntimeException("REFRESH_TOKEN_EXPIRED");
        }

        return jwtProvider.generateAccessToken(token.getUser());
    }

    // logout
    public void logout(String refreshToken) {

        if (refreshToken == null) return;

        refreshTokenRepository.deleteByTokenHash(hash(refreshToken));
    }

    // =========================
    // 내부 공통 로직
    // =========================

    private AuthResponse issueTokens(User user) {

        String accessToken =
                jwtProvider.generateAccessToken(user);

        String refreshToken =
                generateRefreshToken();

        // 기존 RT 제거 (단일 세션)
        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(hash(refreshToken));
        rt.setExpiresAt(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 14);

        refreshTokenRepository.save(rt);

        return new AuthResponse(accessToken, refreshToken);
    }

    private String generateRefreshToken() {
        return java.util.UUID.randomUUID().toString()
                + java.util.UUID.randomUUID();
    }

    private String hash(String value) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes());
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}