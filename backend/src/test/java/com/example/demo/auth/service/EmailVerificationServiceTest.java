package com.example.demo.auth.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.entity.EmailVerification;
import com.example.demo.user.repository.EmailVerificationRepository;
import com.example.demo.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    @org.junit.jupiter.api.BeforeEach
    void enableVerification() {
        // @Value 필드는 Mockito 가 채우지 않음 — 운영 기본값(true)으로 맞춘다.
        org.springframework.test.util.ReflectionTestUtils.setField(
                emailVerificationService, "verificationEnabled", true);
    }

    private EmailVerification verification(String code, boolean verified,
                                           LocalDateTime expiresAt, int attempts) {
        return EmailVerification.builder()
                .id(1L)
                .email("test@example.com")
                .code(code)
                .verified(verified)
                .verifiedAt(verified ? LocalDateTime.now() : null)
                .expiresAt(expiresAt)
                .attempts(attempts)
                .build();
    }

    // =========================
    // sendCode
    // =========================

    @Test
    @DisplayName("발송 - 이미 가입된 이메일은 EMAIL_DUPLICATED")
    void sendCode_duplicate_email() {

        when(userRepository.existsByEmail(eq("test@example.com")))
                .thenReturn(true);

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.sendCode("test@example.com")
                );

        assertEquals(ErrorCode.EMAIL_DUPLICATED, exception.getErrorCode());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("발송 - 60초 내 재발송은 VERIFICATION_COOLDOWN")
    void sendCode_cooldown() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        EmailVerification recent = verification("123456", false,
                LocalDateTime.now().plusMinutes(10), 0);
        recent.setCreatedAt(LocalDateTime.now().minusSeconds(10));

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(recent));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.sendCode("test@example.com")
                );

        assertEquals(ErrorCode.VERIFICATION_COOLDOWN, exception.getErrorCode());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("발송 성공 - 기존 레코드 삭제 후 새 코드 저장 + 메일 발송, 이메일 정규화")
    void sendCode_success_normalizes_email() {

        when(userRepository.existsByEmail(eq("a@b.com")))
                .thenReturn(false);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(eq("a@b.com")))
                .thenReturn(Optional.empty());

        emailVerificationService.sendCode("  A@B.com  ");

        verify(emailVerificationRepository).deleteByEmail(eq("a@b.com"));
        verify(emailVerificationRepository).save(
                org.mockito.ArgumentMatchers.argThat(v ->
                        "a@b.com".equals(v.getEmail())
                                && v.getCode().matches("\\d{6}"))
        );
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("발송 - 메일 전송 실패 시 MAIL_SEND_ERROR")
    void sendCode_mail_failure() {

        when(userRepository.existsByEmail(any()))
                .thenReturn(false);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.empty());

        doThrow(new RuntimeException("smtp down"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.sendCode("test@example.com")
                );

        assertEquals(ErrorCode.MAIL_SEND_ERROR, exception.getErrorCode());
    }

    // =========================
    // verifyCode
    // =========================

    @Test
    @DisplayName("검증 성공 - verified 마킹")
    void verifyCode_success() {

        EmailVerification v = verification("123456", false,
                LocalDateTime.now().plusMinutes(5), 0);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        emailVerificationService.verifyCode("test@example.com", "123456");

        assertTrue(v.isVerified());
        assertNotNull(v.getVerifiedAt());
    }

    @Test
    @DisplayName("검증 - 코드 불일치 시 시도 횟수 증가 + VERIFICATION_CODE_INVALID")
    void verifyCode_wrong_code() {

        EmailVerification v = verification("123456", false,
                LocalDateTime.now().plusMinutes(5), 0);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.verifyCode("test@example.com", "000000")
                );

        assertEquals(ErrorCode.VERIFICATION_CODE_INVALID, exception.getErrorCode());
        assertEquals(1, v.getAttempts());
        assertFalse(v.isVerified());
    }

    @Test
    @DisplayName("검증 - 만료된 코드는 삭제 + VERIFICATION_CODE_EXPIRED")
    void verifyCode_expired() {

        EmailVerification v = verification("123456", false,
                LocalDateTime.now().minusMinutes(1), 0);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.verifyCode("test@example.com", "123456")
                );

        assertEquals(ErrorCode.VERIFICATION_CODE_EXPIRED, exception.getErrorCode());
        verify(emailVerificationRepository).delete(v);
    }

    @Test
    @DisplayName("검증 - 5회 실패하면 폐기 + VERIFICATION_CODE_EXPIRED")
    void verifyCode_too_many_attempts() {

        EmailVerification v = verification("123456", false,
                LocalDateTime.now().plusMinutes(5), 5);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.verifyCode("test@example.com", "123456")
                );

        assertEquals(ErrorCode.VERIFICATION_CODE_EXPIRED, exception.getErrorCode());
        verify(emailVerificationRepository).delete(v);
    }

    @Test
    @DisplayName("검증 - 레코드 없으면 VERIFICATION_CODE_INVALID")
    void verifyCode_no_record() {

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.empty());

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.verifyCode("test@example.com", "123456")
                );

        assertEquals(ErrorCode.VERIFICATION_CODE_INVALID, exception.getErrorCode());
    }

    // =========================
    // consumeVerified
    // =========================

    @Test
    @DisplayName("소비 성공 - 검증된 레코드 삭제")
    void consumeVerified_success() {

        EmailVerification v = verification("123456", true,
                LocalDateTime.now().plusMinutes(5), 0);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(eq("test@example.com")))
                .thenReturn(Optional.of(v));

        emailVerificationService.consumeVerified("test@example.com");

        verify(emailVerificationRepository).delete(v);
    }

    @Test
    @DisplayName("소비 - 미검증 레코드면 EMAIL_NOT_VERIFIED")
    void consumeVerified_not_verified() {

        EmailVerification v = verification("123456", false,
                LocalDateTime.now().plusMinutes(5), 0);

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.consumeVerified("test@example.com")
                );

        assertEquals(ErrorCode.EMAIL_NOT_VERIFIED, exception.getErrorCode());
    }

    @Test
    @DisplayName("소비 - 검증 후 30분 지나면 EMAIL_NOT_VERIFIED")
    void consumeVerified_window_expired() {

        EmailVerification v = verification("123456", true,
                LocalDateTime.now().plusMinutes(5), 0);
        v.setVerifiedAt(LocalDateTime.now().minusMinutes(31));

        when(emailVerificationRepository.findTopByEmailOrderByIdDesc(any()))
                .thenReturn(Optional.of(v));

        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> emailVerificationService.consumeVerified("test@example.com")
                );

        assertEquals(ErrorCode.EMAIL_NOT_VERIFIED, exception.getErrorCode());
    }
}
