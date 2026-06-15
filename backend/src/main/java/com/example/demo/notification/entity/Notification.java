package com.example.demo.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 알림 (notifications).
 *
 * <p>{@code userId} 는 알림 <b>수신자</b>(글 작성자)다. Walk 와 동일하게 단순 컬럼으로 매핑하고
 * 소유자 검증은 Service 에서 처리한다(FK 는 schema 에 존재).
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Notifications (알림)" 섹션.
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 수신자(알림을 받는 사용자) id. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private NotificationType type;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Notification(Long userId, NotificationType type, String title, String content, String linkUrl) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.content = content;
        this.linkUrl = linkUrl;
        this.isRead = false;
    }

    /** 새 알림 생성 (미읽음 상태). */
    public static Notification create(Long userId, NotificationType type,
                                      String title, String content, String linkUrl) {
        return Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .content(content)
                .linkUrl(linkUrl)
                .build();
    }

    public void markAsRead() {
        this.isRead = true;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
