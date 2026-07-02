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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
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

    // 기본 no-op(mock) = 인증 완료 취급. 미인증 케이스는 개별 테스트에서 throw 스텁.
    @Mock
    private EmailVerificationService emailVerificationService;

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
                "테스트유저",
                null
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
                                "테스트유저",
                                null
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
                                "테스트유저",
                                null
                        )
                );

        assertEquals(
                ErrorCode.NICKNAME_DUPLICATED,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("회원가입 - 이메일 미인증이면 EMAIL_NOT_VERIFIED")
    void signup_email_not_verified() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        doThrow(new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED))
                .when(emailVerificationService)
                .consumeVerified(any());

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.signup(
                                "test@example.com",
                                "password123",
                                "테스트유저",
                                null
                        )
                );

        assertEquals(
                ErrorCode.EMAIL_NOT_VERIFIED,
                exception.getErrorCode()
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("회원가입 - 인증 소비는 정규화된 이메일로 호출")
    void signup_consumes_verification_with_normalized_email() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        when(passwordEncoder.encode(any()))
                .thenReturn("encodedPassword");

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        authService.signup(
                "  A@B.com  ",
                "password123",
                "테스트유저",
                null
        );

        verify(emailVerificationService).consumeVerified(eq("a@b.com"));
    }

    @Test
    @DisplayName("회원가입 - 이메일 대소문자/공백 정규화 (A@B.com → a@b.com)")
    void signup_normalizes_email() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        when(passwordEncoder.encode(any()))
                .thenReturn("encodedPassword");

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        authService.signup(
                "  A@B.com  ",
                "password123",
                "테스트유저",
                null
        );

        // 정규화된 이메일로 중복 체크 + 저장이 일어나야 함.
        verify(userRepository).existsByEmail(eq("a@b.com"));

        verify(userRepository).save(
                argThat(u -> "a@b.com".equals(u.getEmail()))
        );
    }

    @Test
    @DisplayName("회원가입 - 대소문자만 다른 이메일 중복 차단")
    void signup_duplicate_email_case_insensitive() {

        // 기존 사용자가 a@b.com 으로 가입돼 있다고 가정.
        when(userRepository.existsByEmail(eq("a@b.com")))
                .thenReturn(true);

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.signup(
                                "A@B.COM",
                                "password123",
                                "테스트유저",
                                null
                        )
                );

        assertEquals(
                ErrorCode.EMAIL_DUPLICATED,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("회원가입 - 닉네임 정규화 (양끝/내부 공백 모두 제거)")
    void signup_normalizes_nickname() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        when(passwordEncoder.encode(any()))
                .thenReturn("encodedPassword");

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        authService.signup(
                "test@example.com",
                "password123",
                "  댕 댕 이 맘  ",
                null
        );

        // 양끝 공백 + 내부 공백 모두 제거된 값으로 중복 체크/저장이 일어나야 함.
        verify(userRepository).existsByNickname(eq("댕댕이맘"));

        verify(userRepository).save(
                argThat(u -> "댕댕이맘".equals(u.getNickname()))
        );
    }

    @Test
    @DisplayName("회원가입 - 전각 공백(　)도 정규화에서 제거")
    void signup_normalizes_fullwidth_whitespace_in_nickname() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(userRepository.existsByNickname(any()))
                .thenReturn(false);

        when(passwordEncoder.encode(any()))
                .thenReturn("encodedPassword");

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        authService.signup(
                "test@example.com",
                "password123",
                "댕댕이　맘"   ,// 전각 공백
                null
        );

        // (?U) 플래그로 유니코드 공백까지 잡아야 함 — 향후 플래그 누락 회귀 방지용.
        verify(userRepository).existsByNickname(eq("댕댕이맘"));
    }

    @Test
    @DisplayName("회원가입 - 닉네임이 공백만 입력되면 INVALID_INPUT")
    void signup_nickname_only_whitespace_throws() {

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> authService.signup(
                                "test@example.com",
                                "password123",
                                "        ",
                                null
                        )
                );

        // @Size(min=2) 는 raw 입력 통과시키지만, 정규화 후 빈 문자열이 되는 트릭 차단.
        assertEquals(
                ErrorCode.INVALID_INPUT,
                exception.getErrorCode()
        );
    }

    @Test
    @DisplayName("로그인 - 이메일 정규화 후 조회")
    void login_normalizes_email() {

        when(userRepository.findByEmail(eq("a@b.com")))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(any(), any()))
                .thenReturn(true);

        when(jwtProvider.generateAccessToken(any()))
                .thenReturn("access-token");

        AuthResponse response =
                authService.login(
                        "  A@B.com  ",
                        "password123"
                );

        assertNotNull(response);

        verify(userRepository).findByEmail(eq("a@b.com"));
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
    @DisplayName("존재하지 않는 유저 로그인 - account enumeration 차단을 위해 INVALID_CREDENTIALS 응답")
    void login_user_not_found_returns_invalid_credentials() {

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

        // 보안: 이메일이 없을 때와 비번이 틀릴 때 응답을 동일하게 → 회원 명단 추출 차단 (OWASP).
        assertEquals(
                ErrorCode.INVALID_CREDENTIALS,
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