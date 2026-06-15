package com.example.demo.notification.entity;

/**
 * 알림 유형. {@code notifications.type}(VARCHAR) 에 enum 이름으로 저장된다.
 *
 * <p>MVP 범위: 내 글에 달린 댓글({@link #COMMENT})·좋아요({@link #LIKE}).
 * 배지/동반산책 등(BADGE_EARNED·COMPANION_REQUEST)은 Phase 2 에서 추가.
 */
public enum NotificationType {
    COMMENT,
    LIKE
}
