package com.example.demo.notification.dto;

import com.example.demo.notification.entity.Notification;

import java.time.LocalDateTime;

/**
 * 알림 단건 응답.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "알림 목록" 섹션.
 */
public record NotificationResponse(
        Long notificationId,
        String type,
        String title,
        String content,
        String linkUrl,
        boolean isRead,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType() == null ? null : n.getType().name(),
                n.getTitle(),
                n.getContent(),
                n.getLinkUrl(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
