package com.example.demo.notification.dto;

import java.util.List;

/**
 * 알림 목록 응답.
 *
 * @param notifications 조회된 알림(페이지) 목록
 * @param unreadCount   안 읽은 알림 총 개수 (페이지와 무관, 벨 뱃지용)
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "알림 목록" 섹션.
 */
public record NotificationListResponse(
        List<NotificationResponse> notifications,
        long unreadCount
) {
}
