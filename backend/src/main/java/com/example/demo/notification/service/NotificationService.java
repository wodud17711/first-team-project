package com.example.demo.notification.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.entity.Comment;
import com.example.demo.community.entity.Post;
import com.example.demo.community.repository.CommentRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.notification.dto.NotificationListResponse;
import com.example.demo.notification.dto.NotificationResponse;
import com.example.demo.notification.entity.Notification;
import com.example.demo.notification.entity.NotificationType;
import com.example.demo.notification.repository.NotificationRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 알림 생성 트리거 + 조회/읽음 처리.
 *
 * <p>생성은 커뮤니티 흐름(댓글·좋아요)에서 호출된다({@link #notifyNewComment}/{@link #notifyNewLike}).
 * 같은 트랜잭션에 참여하므로, 원 행위(댓글 저장 등)가 롤백되면 알림도 함께 롤백된다.
 * <b>자기 글에 자기가 단 댓글/좋아요는 알림을 만들지 않는다.</b>
 *
 * <p>조회 시 {@code actor_id}/{@code post_id}/{@code comment_id} 로 게시글 제목·댓글 내용·반응자
 * 프로필을 조인해 채운다. 좋아요(LIKE) 알림은 게시글 기준으로 묶어 대표 1건 + 총 인원수로 내려간다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Notifications (알림)" 섹션.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    /** 내 글에 댓글이 달리면 글 작성자에게 알림 생성. */
    @Transactional
    public void notifyNewComment(Post post, User actor, Comment comment) {
        Long recipientId = recipientOf(post, actor);
        if (recipientId == null) {
            return;
        }
        notificationRepository.save(Notification.create(
                recipientId,
                actor.getId(),
                post.getId(),
                comment.getId(),
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
                actor.getId(),
                post.getId(),
                null,
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

    /**
     * 내 알림 목록(+안읽음 수). {@code unreadOnly} 면 안 읽은 것만, {@code type} 이 주어지면
     * 그 타입만(카테고리 탭: 좋아요/댓글). {@code type} 이 {@code null} 이면 전체.
     *
     * <p>LIKE 알림은 한 페이지 안에서 게시글 기준으로 묶어 대표 1건만 내려간다(나머지는 접힘).
     * {@code unreadCount}(벨 뱃지)는 타입·묶음과 무관하게 전체 안 읽은 행 수다.
     */
    public NotificationListResponse list(Long userId, NotificationType type,
                                         boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = findPage(userId, type, unreadOnly, pageable);

        List<Notification> rows = page.getContent();
        Context ctx = loadContext(rows);

        List<NotificationResponse> items = new ArrayList<>();
        Set<Long> collapsedLikePosts = new HashSet<>();
        for (Notification n : rows) {
            boolean groupedLike = n.getType() == NotificationType.LIKE && n.getPostId() != null;
            if (groupedLike && !collapsedLikePosts.add(n.getPostId())) {
                continue; // 같은 게시글 좋아요는 대표 1건만(이 페이지 기준 접힘)
            }
            int actorCount = groupedLike
                    ? (int) notificationRepository.countDistinctActorsByPost(
                            userId, NotificationType.LIKE, n.getPostId())
                    : 1;
            items.add(toResponse(n, ctx, actorCount));
        }

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
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

    /** 타입 필터(null=전체) × 안읽음 필터 조합으로 페이지를 조회한다. */
    private Page<Notification> findPage(Long userId, NotificationType type,
                                        boolean unreadOnly, Pageable pageable) {
        if (type == null) {
            return unreadOnly
                    ? notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByUserIdOrderByIsReadAscCreatedAtDesc(userId, pageable);
        }
        return unreadOnly
                ? notificationRepository.findByUserIdAndTypeAndIsReadFalseOrderByCreatedAtDesc(userId, type, pageable)
                : notificationRepository.findByUserIdAndTypeOrderByIsReadAscCreatedAtDesc(userId, type, pageable);
    }

    /** 페이지 내 알림들이 참조하는 actor·post·comment 를 한 번에 적재(조회 N+1 방지). */
    private Context loadContext(List<Notification> rows) {
        Set<Long> actorIds = collectIds(rows, Notification::getActorId);
        Set<Long> postIds = collectIds(rows, Notification::getPostId);
        Set<Long> commentIds = collectIds(rows, Notification::getCommentId);

        Map<Long, User> actors = userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Post> posts = postRepository.findAllById(postIds).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));
        Map<Long, Comment> comments = commentRepository.findAllById(commentIds).stream()
                .collect(Collectors.toMap(Comment::getId, Function.identity()));
        return new Context(actors, posts, comments);
    }

    private Set<Long> collectIds(List<Notification> rows, Function<Notification, Long> idGetter) {
        Set<Long> ids = new HashSet<>();
        for (Notification n : rows) {
            Long id = idGetter.apply(n);
            if (id != null) {
                ids.add(id);
            }
        }
        return ids;
    }

    private NotificationResponse toResponse(Notification n, Context ctx, int actorCount) {
        NotificationResponse.ActorSummary actor = null;
        if (n.getActorId() != null) {
            User u = ctx.actors().get(n.getActorId());
            if (u != null) {
                actor = new NotificationResponse.ActorSummary(
                        u.getId(), u.getNickname(), u.getProfileImageUrl());
            }
        }

        NotificationResponse.PostSummary post = null;
        if (n.getPostId() != null) {
            Post p = ctx.posts().get(n.getPostId());
            if (p != null) {
                post = new NotificationResponse.PostSummary(p.getId(), p.getTitle());
            }
        }

        NotificationResponse.CommentSummary comment = null;
        if (n.getCommentId() != null) {
            Comment c = ctx.comments().get(n.getCommentId());
            if (c != null) {
                comment = new NotificationResponse.CommentSummary(c.getId(), c.getContent());
            }
        }

        return new NotificationResponse(
                n.getId(),
                n.getType() == null ? null : n.getType().name(),
                n.getTitle(),
                n.getContent(),
                n.getLinkUrl(),
                n.isRead(),
                n.getCreatedAt(),
                actor,
                post,
                comment,
                actorCount);
    }

    /** 조회 보강용 컨텍스트(id → 엔티티). */
    private record Context(Map<Long, User> actors, Map<Long, Post> posts, Map<Long, Comment> comments) {
    }
}
