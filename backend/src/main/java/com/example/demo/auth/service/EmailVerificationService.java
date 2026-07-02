package com.example.demo.auth.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.entity.EmailVerification;
import com.example.demo.user.repository.EmailVerificationRepository;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 회원가입 이메일 인증 (6자리 코드).
 *
 * <p>플로우: 발송(send) → 검증(verify) → 가입 시 소비(consume).
 * 재발송 쿨다운 60초 / 코드 10분 유효 / 입력 5회 실패 시 폐기 / 검증 후 30분 내 가입.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final int CODE_TTL_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;
    private static final int VERIFIED_WINDOW_MINUTES = 30;

    private final EmailVerificationRepository emailVerificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    private final SecureRandom random = new SecureRandom();

    // Brevo(HTTPS 메일 API) 호출용 — 표준 HTTPS 라 AiClient 전용 HTTP/1.1 고정 RestClient 와 분리.
    private final RestClient restClient = RestClient.create();

    @Value("${spring.mail.username:}")
    private String fromAddress;

    // 있으면 Brevo HTTPS API 로 발송 (Render 무료 티어 SMTP 차단 우회).
    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    /**
     * 가입 시 이메일 인증 강제 여부. 운영 기본 true.
     * 테스트 프로필(H2 E2E — signup 을 직접 호출)은 false 로 게이트를 끈다.
     */
    @Value("${app.auth.email-verification:true}")
    private boolean verificationEnabled;

    /** 인증 코드 발송. 이미 가입된 이메일은 즉시 차단(가입 시점에도 재확인됨). */
    public void sendCode(String rawEmail) {

        String email = normalizeEmail(rawEmail);

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }

        // 재발송 쿨다운 — 메일 폭탄/Gmail 일일 한도(500통) 보호.
        emailVerificationRepository.findTopByEmailOrderByIdDesc(email)
                .filter(prev -> prev.getCreatedAt()
                        .isAfter(LocalDateTime.now().minusSeconds(RESEND_COOLDOWN_SECONDS)))
                .ifPresent(prev -> {
                    throw new BusinessException(ErrorCode.VERIFICATION_COOLDOWN);
                });

        String code = String.format("%06d", random.nextInt(1_000_000));

        // 이메일당 최신 1건만 유효.
        emailVerificationRepository.deleteByEmail(email);
        emailVerificationRepository.save(
                EmailVerification.builder()
                        .email(email)
                        .code(code)
                        .expiresAt(LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES))
                        .build()
        );

        sendMail(email, code);
    }

    /** 코드 검증. 성공 시 verified 마킹(가입은 별도 요청). */
    public void verifyCode(String rawEmail, String code) {

        String email = normalizeEmail(rawEmail);

        EmailVerification verification =
                emailVerificationRepository.findTopByEmailOrderByIdDesc(email)
                        .orElseThrow(() ->
                                new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID));

        if (verification.isVerified()) {
            return; // 이미 검증됨 — 멱등 처리
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())
                || verification.getAttempts() >= MAX_ATTEMPTS) {
            emailVerificationRepository.delete(verification);
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }

        if (!verification.getCode().equals(code)) {
            verification.setAttempts(verification.getAttempts() + 1);
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID);
        }

        verification.setVerified(true);
        verification.setVerifiedAt(LocalDateTime.now());
    }

    /**
     * 가입 직전 호출 — 검증 완료(30분 내) 상태를 확인하고 레코드를 소비(삭제)한다.
     * 미검증이면 {@link ErrorCode#EMAIL_NOT_VERIFIED}.
     */
    public void consumeVerified(String email) {

        if (!verificationEnabled) {
            return;
        }

        EmailVerification verification =
                emailVerificationRepository.findTopByEmailOrderByIdDesc(email)
                        .filter(EmailVerification::isVerified)
                        .filter(v -> v.getVerifiedAt() != null
                                && v.getVerifiedAt().isAfter(
                                        LocalDateTime.now().minusMinutes(VERIFIED_WINDOW_MINUTES)))
                        .orElseThrow(() ->
                                new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED));

        emailVerificationRepository.delete(verification);
    }

    private static final String MAIL_SUBJECT = "[댕기온] 이메일 인증 코드";

    private String mailBody(String code) {
        return """
                댕기온 회원가입 인증 코드입니다.

                인증 코드: %s

                이 코드는 %d분 동안 유효합니다.
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
                """.formatted(code, CODE_TTL_MINUTES);
    }

    // Brevo API 키가 있으면 HTTPS(443) API 로, 없으면 SMTP 로 발송.
    // 운영(Render 무료 티어)은 아웃바운드 SMTP 25/465/587 차단 → Brevo HTTP 필수.
    // 로컬은 Gmail SMTP 그대로 사용 가능.
    private void sendMail(String to, String code) {

        try {
            if (brevoApiKey != null && !brevoApiKey.isBlank()) {
                sendViaBrevo(to, code);
            } else {
                sendViaSmtp(to, code);
            }
        } catch (Exception e) {
            // 발송 실패 시 트랜잭션 롤백 → 코드 레코드도 남지 않음(쿨다운 오탐 방지).
            throw new BusinessException(ErrorCode.MAIL_SEND_ERROR);
        }
    }

    private void sendViaSmtp(String to, String code) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(MAIL_SUBJECT);
        message.setText(mailBody(code));

        mailSender.send(message);
    }

    private void sendViaBrevo(String to, String code) {

        Map<String, Object> body = Map.of(
                "sender", Map.of("name", "댕기온", "email", fromAddress),
                "to", List.of(Map.of("email", to)),
                "subject", MAIL_SUBJECT,
                "textContent", mailBody(code)
        );

        // 201 외 상태코드는 RestClient 가 예외 → sendMail 의 catch 에서 MAIL_SEND_ERROR 로 수렴.
        restClient.post()
                .uri("https://api.brevo.com/v3/smtp/email")
                .header("api-key", brevoApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private String normalizeEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return email.trim().toLowerCase();
    }
}
