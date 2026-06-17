package com.example.demo.notification.dto;

import java.time.LocalDateTime;

/**
 * 알림 단건 응답.
 *
 * <p>{@code title}/{@code content} 는 생성 시점 스냅샷 문자열(하위호환)이고,
 * {@code actor}/{@code post}/{@code comment} 는 조회 시점에 조인해 채우는 최신 컨텍스트다.
 * LIKE 알림은 게시글 기준으로 묶여 대표 1건만 내려가며, {@code actorCount} 가 그 게시글에
 * 좋아요를 누른 총 인원이다("{@code actor.nickname}님 외 {@code actorCount-1}명").
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "알림 목록" 섹션.
 *
 * @param actor      알림을 유발한 사용자(대표). 조회 시점 프로필. 없으면 null
 * @param post       관련 게시글(현재 제목). 없으면 null
 * @param comment    관련 댓글(COMMENT 타입만). 없으면 null
 * @param actorCount 같은 게시글에 반응한 총 인원. COMMENT·단건은 1
 */
public record NotificationResponse(
        Long notificationId,
        String type,
        String title,
        String content,
        String linkUrl,
        boolean isRead,
        LocalDateTime createdAt,
        ActorSummary actor,
        PostSummary post,
        CommentSummary comment,
        int actorCount
) {
    /** 반응한 사용자 요약(프로필 이미지 포함). */
    public record ActorSummary(Long id, String nickname, String profileImageUrl) {
    }

    /** 관련 게시글 요약. */
    public record PostSummary(Long id, String title) {
    }

    /** 관련 댓글 요약. */
    public record CommentSummary(Long id, String content) {
    }
}
