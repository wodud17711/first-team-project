package com.example.demo.notification.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.entity.Post;
import com.example.demo.notification.dto.NotificationListResponse;
import com.example.demo.notification.dto.NotificationResponse;
import com.example.demo.notification.entity.Notification;
import com.example.demo.notification.entity.NotificationType;
import com.example.demo.notification.repository.NotificationRepository;
import com.example.demo.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 알림 생성 트리거 + 조회/읽음 처리.
 *
 * <p>생성은 커뮤니티 흐름(댓글·좋아요)에서 호출된다({@link #notifyNewComment}/{@link #notifyNewLike}).
 * 같은 트랜잭션에 참여하므로, 원 행위(댓글 저장 등)가 롤백되면 알림도 함께 롤백된다.
 * <b>자기 글에 자기가 단 댓글/좋아요는 알림을 만들지 않는다.</b>
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Notifications (알림)" 섹션.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** 내 글에 댓글이 달리면 글 작성자에게 알림 생성. */
    @Transactional
    public void notifyNewComment(Post post, User actor) {
        Long recipientId = recipientOf(post, actor);
        if (recipientId == null) {
            return;
        }
        notificationRepository.save(Notification.create(
                recipientId,
                NotificationType.COMMENT,
                "새 댓글",
                actor.getNickname() + "님이 회원님의 글에 댓글을 남겼습니다.",
                "/posts/" + post.getId()));
    }

    /** 내 글에 좋아요가 눌리면 글 작성자에게 알림 생성. */
    @Transactional
    public void notifyNewLike(Post post, User actor) {
        Long recipientId = recipientOf(post, actor);
        if (recipientId == null) {
            return;
        }
        notificationRepository.save(Notification.create(
                recipientId,
                NotificationType.LIKE,
                "새 좋아요",
                actor.getNickname() + "님이 회원님의 글을 좋아합니다.",
                "/posts/" + post.getId()));
    }

    /**
     * 알림 수신자 id 를 결정한다. 글 작성자가 없거나(이상 데이터) 행위자 본인이면 {@code null}
     * (= 알림 생성 안 함).
     */
    private Long recipientOf(Post post, User actor) {
        if (post.getUser() == null) {
            return null;
        }
        Long authorId = post.getUser().getId();
        if (authorId.equals(actor.getId())) {
            return null;
        }
        return authorId;
    }

    /** 내 알림 목록(+안읽음 수). {@code unreadOnly} 면 안 읽은 것만. */
    public NotificationListResponse list(Long userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdOrderByIsReadAscCreatedAtDesc(userId, pageable);

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        List<NotificationResponse> items = page.getContent().stream()
                .map(NotificationResponse::from)
                .toList();
        return new NotificationListResponse(items, unreadCount);
    }

    /** 단건 읽음 처리. 본인 알림이 아니면 404. */
    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notification.markAsRead();
    }

    /** 내 안 읽은 알림 일괄 읽음 처리. */
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }
}
