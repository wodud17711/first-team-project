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

    /** 알림을 유발한 사용자 id (댓글·좋아요를 누른 사람). 조회 시 프로필을 조인한다. */
    @Column(name = "actor_id")
    private Long actorId;

    /** 관련 게시글 id. 조회 시 제목을 조인하고, LIKE 집계의 그룹 키가 된다. */
    @Column(name = "post_id")
    private Long postId;

    /** 관련 댓글 id (COMMENT 타입만). 조회 시 댓글 내용을 조인한다. */
    @Column(name = "comment_id")
    private Long commentId;

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
    private Notification(Long userId, Long actorId, Long postId, Long commentId,
                         NotificationType type, String title, String content, String linkUrl) {
        this.userId = userId;
        this.actorId = actorId;
        this.postId = postId;
        this.commentId = commentId;
        this.type = type;
        this.title = title;
        this.content = content;
        this.linkUrl = linkUrl;
        this.isRead = false;
    }

    /** 새 알림 생성 (미읽음 상태). {@code actorId}/{@code postId}/{@code commentId} 는 조회 보강용 참조. */
    public static Notification create(Long userId, Long actorId, Long postId, Long commentId,
                                      NotificationType type, String title, String content, String linkUrl) {
        return Notification.builder()
                .userId(userId)
                .actorId(actorId)
                .postId(postId)
                .commentId(commentId)
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
