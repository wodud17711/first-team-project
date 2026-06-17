package com.example.demo.notification.repository;

import com.example.demo.notification.entity.Notification;
import com.example.demo.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** 내 알림 전체. 안 읽은 것(isRead=false) 우선, 같은 그룹 내 최신순. */
    Page<Notification> findByUserIdOrderByIsReadAscCreatedAtDesc(Long userId, Pageable pageable);

    /** 내 안 읽은 알림만. 최신순. */
    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** 특정 타입 알림. 안 읽은 것 우선, 최신순. (카테고리 탭: 좋아요/댓글) */
    Page<Notification> findByUserIdAndTypeOrderByIsReadAscCreatedAtDesc(
            Long userId, NotificationType type, Pageable pageable);

    /** 특정 타입의 안 읽은 알림만. 최신순. */
    Page<Notification> findByUserIdAndTypeAndIsReadFalseOrderByCreatedAtDesc(
            Long userId, NotificationType type, Pageable pageable);

    /** 안 읽은 알림 개수 (벨 뱃지용). */
    long countByUserIdAndIsReadFalse(Long userId);

    /** 소유권 포함 단건 조회 (남의 알림 읽음 처리 방지). */
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /**
     * 특정 게시글에 반응한 actor 인원 수 (LIKE 집계 "외 N명" 용).
     * 같은 사용자가 토글로 중복 행을 만들어도 actor 기준 distinct 로 센다.
     */
    @Query("SELECT COUNT(DISTINCT n.actorId) FROM Notification n "
            + "WHERE n.userId = :userId AND n.type = :type AND n.postId = :postId")
    long countDistinctActorsByPost(@Param("userId") Long userId,
                                   @Param("type") NotificationType type,
                                   @Param("postId") Long postId);

    /** 내 안 읽은 알림 일괄 읽음 처리. 반환값 = 갱신된 행 수. */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllReadByUserId(@Param("userId") Long userId);
}
