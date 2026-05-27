package com.example.demo.auth.service;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.security.JwtProvider;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.entity.RefreshToken;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.RefreshTokenRepository;
import com.example.demo.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {

        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .nickname("테스트유저")
                .build();
    }

    @Test
    @DisplayName("회원가입 성공")
    void signup_success() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        when(passwordEncoder.encode(any()))
                .thenReturn("encodedPassword");

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        AuthResponse response = authService.signup(
                "test@example.com",
                "password123",
                "테스트유저"
        );

        assertNotNull(response);
        assertEquals(
                "access-token",
                response.accessToken()
        );

        verify(userRepository)
                .save(any(User.class));

        verify(refreshTokenRepository)
                .save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("회원가입 이메일 중복")
    void signup_duplicate_email() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(true);

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.signup(
                                "test@example.com",
                                "password123",
                                "테스트유저"
                        )
                );

        assertEquals(
                ErrorCode.EMAIL_DUPLICATED,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("회원가입 닉네임 중복")
    void signup_duplicate_nickname() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(true);

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.signup(
                                "test@example.com",
                                "password123",
                                "테스트유저"
                        )
                );

        assertEquals(
                ErrorCode.NICKNAME_DUPLICATED,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("로그인 성공")
    void login_success() {

        when(userRepository.findByEmail(any()))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(any(), any()))
                .thenReturn(true);

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        AuthResponse response =
                authService.login(
                        "test@example.com",
                        "password123"
                );

        assertNotNull(response);

        assertEquals(
                "access-token",
                response.accessToken()
        );
    }

    @Test
    @DisplayName("로그인 비밀번호 불일치")
    void login_invalid_password() {

        when(userRepository.findByEmail(any()))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(any(), any()))
                .thenReturn(false);

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.login(
                                "test@example.com",
                                "wrongPassword"
                        )
                );

        assertEquals(
                ErrorCode.INVALID_CREDENTIALS,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("존재하지 않는 유저 로그인")
    void login_user_not_found() {

        when(userRepository.findByEmail(any()))
                .thenReturn(Optional.empty());

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.login(
                                "wrong@example.com",
                                "password123"
                        )
                );

        assertEquals(
                ErrorCode.USER_NOT_FOUND,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("refresh token null")
    void refresh_null_token() {

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.refresh(null)
                );

        assertEquals(
                ErrorCode.INVALID_TOKEN,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("만료된 refresh token")
    void refresh_expired_token() {

        RefreshToken token = RefreshToken.builder()
                .id(1L)
                .user(user)
                .tokenHash("hashed-token")
                .expiresAt(System.currentTimeMillis() - 1000)
                .build();

        when(refreshTokenRepository.findByTokenHash(any()))
                .thenReturn(Optional.of(token));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.refresh(
                                "refresh-token"
                        )
                );

        assertEquals(
                ErrorCode.EXPIRED_REFRESH_TOKEN,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("로그아웃 성공")
    void logout_success() {

        authService.logout("refresh-token");

        verify(refreshTokenRepository)
                .deleteByTokenHash(any());
    }
}