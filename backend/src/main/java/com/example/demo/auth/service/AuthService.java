package com.example.demo.auth.service;

import com.example.demo.auth.dto.*;
import com.example.demo.auth.security.JwtProvider;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.entity.RefreshToken;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.RefreshTokenRepository;
import com.example.demo.user.repository.UserRepository;
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
    public AuthResponse signup(String email, String password) {

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        userRepository.save(user);

        return issueTokens(user);
    }

    // =========================
    // 로그인
    // =========================
    public AuthResponse login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return issueTokens(user);
    }

    // =========================
    // refresh
    // =========================
    public String refresh(String refreshToken) {

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        RefreshToken token =
                refreshTokenRepository.findByTokenHash(hash(refreshToken))
                        .orElseThrow(() ->
                                new BusinessException(ErrorCode.INVALID_TOKEN));

        if (token.isExpired()) {
            throw new BusinessException(ErrorCode.EXPIRED_REFRESH_TOKEN);
        }

        return jwtProvider.generateAccessToken(token.getUser().getId());
    }

    // =========================
    // logout
    // =========================
    public void logout(String refreshToken) {

        if (refreshToken == null) return;

        refreshTokenRepository.deleteByTokenHash(hash(refreshToken));
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