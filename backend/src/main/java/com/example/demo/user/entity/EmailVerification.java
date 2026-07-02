package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 회원가입 이메일 인증 코드.
 *
 * <p>이메일당 최신 1건만 유효(재발송 시 기존 레코드 삭제 후 재생성).
 * 코드는 10분 유효, 검증 성공(verified=true) 후 30분 안에 가입을 마쳐야 하며
 * 가입 완료 시 레코드를 삭제(consume)한다.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "email_verifications",
        indexes = {
                @Index(name = "idx_email_verifications_email", columnList = "email")
        }
)
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 인증 대상 이메일 (정규화된 값)
    @Column(nullable = false, length = 100)
    private String email;

    // 6자리 인증 코드
    @Column(nullable = false, length = 6)
    private String code;

    // 코드 만료 시각 (발송 +10분)
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // 코드 검증 완료 여부
    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    // 검증 완료 시각 (가입 유효 창 판단용)
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    // 코드 입력 실패 횟수 (브루트포스 차단)
    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
