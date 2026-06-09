package com.example.demo.walk.domain;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 산책 기록 (walks).
 *
 * <p>{@code user_id} 는 Dog 와 동일하게 단순 컬럼으로 매핑한다 (User 엔티티 머지 후 @ManyToOne 으로 교체).
 * 소유자 검증은 Service 에서 {@code userId} 비교로 처리한다.
 *
 * <p>실시간 GPS(walk_locations)·산책로(walk_route_id)는 Phase 2~3 범위라 MVP 엔티티에서 제외.
 * walk_scores 연결은 별도 카드(A-2)에서 처리한다.
 */
@Entity
@Table(name = "walks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLRestriction("deleted_at IS NULL")
public class Walk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: User 엔티티 머지 후 @ManyToOne 으로 교체
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "distance_km", precision = 5, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "user_feedback", columnDefinition = "TEXT")
    private String userFeedback;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    private Walk(Long userId, Dog dog, LocalDateTime startTime) {
        this.userId = userId;
        this.dog = dog;
        this.startTime = startTime;
    }

    /** 산책 시작. start_time = 호출 시각. */
    public static Walk start(Long userId, Dog dog) {
        return Walk.builder()
                .userId(userId)
                .dog(dog)
                .startTime(LocalDateTime.now())
                .build();
    }

    /**
     * 산책 종료. end_time = 호출 시각, duration 은 start~end 분 단위 자동 계산.
     * distanceKm/memo/userFeedback 은 {@code null} 이면 채우지 않는다.
     */
    public void end(BigDecimal distanceKm, String memo, String userFeedback) {
        if (!isInProgress()) {
            throw new BusinessException(ErrorCode.WALK_ALREADY_ENDED);
        }
        this.endTime = LocalDateTime.now();
        this.durationMinutes = (int) Duration.between(startTime, endTime).toMinutes();
        if (distanceKm != null) this.distanceKm = distanceKm;
        if (memo != null) this.memo = memo;
        if (userFeedback != null) this.userFeedback = userFeedback;
    }

    public boolean isInProgress() {
        return endTime == null;
    }

    public boolean isOwnedBy(Long userId) {
        return this.userId.equals(userId);
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
