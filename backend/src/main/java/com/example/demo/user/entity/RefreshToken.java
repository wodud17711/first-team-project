package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 유저의 refresh token인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // refresh token hash 저장 (보안 때문에 raw token 저장 X)
    @Column(nullable = false, unique = true, length = 500)
    private String tokenHash;

    // 만료 시간 (epoch millis)
    @Column(nullable = false)
    private Long expiresAt;

    // 만료 여부 체크
    public boolean isExpired() {
        return System.currentTimeMillis() > expiresAt;
    }
}