package com.example.demo.user.entity;

import com.example.demo.user.type.AuthProvider;
import com.example.demo.user.type.GuardianLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_email", columnList = "email")
        },
        uniqueConstraints = {
                // 소셜 계정 식별: (provider, provider_id) 유일.
                // LOCAL 은 provider_id=NULL → MySQL UNIQUE 가 NULL 다중 허용하므로 로컬 가입엔 영향 없음.
                @UniqueConstraint(name = "uk_users_provider", columnNames = {"provider", "provider_id"})
        }
)
// 소프트 삭제: 탈퇴(deleted_at != null) 유저는 모든 find/exists 쿼리에서 자동 제외.
// → 재가입 시 EMAIL_DUPLICATED 오탐 방지 + 탈퇴자 비번 알아도 로그인 차단.
// 어드민 페이지에서 탈퇴자 조회 필요해지면 별도 native query / @Query(nativeQuery) 로 분리.
@SQLRestriction("deleted_at IS NULL")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이메일 (로그인 ID)
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // 비밀번호 (BCrypt 해시). 소셜 로그인 사용자는 비번이 없으므로 NULL 허용.
    @Column(length = 255)
    private String password;

    // 닉네임
    @Column(nullable = false, length = 50)
    private String nickname;

    // 프로필 이미지 URL
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // 권한 (USER / ADMIN)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    // 가입일시
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 수정일시
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 탈퇴일시 (소프트 삭제)
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 보호자 연차
    @Enumerated(EnumType.STRING)
    @Column(name = "guardian_level", length = 20)
    private GuardianLevel guardianLevel;

    // 인증 제공자 (LOCAL / KAKAO / GOOGLE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    // 소셜 고유 ID (LOCAL=null). (provider, provider_id) 조합으로 소셜 계정 식별.
    @Column(name = "provider_id", length = 255)
    private String providerId;

    // INSERT 시 자동 실행
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // UPDATE 시 자동 실행
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
