package com.example.demo.dog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 반려견 프로필 (dogs).
 *
 * <p>{@code user_id} 는 현재 단순 컬럼으로 매핑되어 있으며,
 * User 엔티티가 develop 에 머지된 이후 {@code @ManyToOne User user} 로 리팩토링한다.
 * 소유자 검증은 Service 레이어에서 {@code userId} 비교로 처리한다.
 */
@Entity
@Table(name = "dogs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLRestriction("deleted_at IS NULL")
public class Dog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: User 엔티티 머지 후 @ManyToOne 으로 교체
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "breed_id")
    private DogBreed breed;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Enumerated(EnumType.STRING)
    @Column(length = 1)
    private Gender gender;

    @Column(name = "is_neutered", nullable = false)
    private boolean neutered;

    @Convert(converter = ActivityLevelConverter.class)
    @Column(name = "activity_level")
    private ActivityLevel activityLevel;

    @Column(name = "health_notes", columnDefinition = "TEXT")
    private String healthNotes;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    private Dog(Long userId, DogBreed breed, String name, LocalDate birthDate,
                BigDecimal weight, Gender gender, boolean neutered,
                ActivityLevel activityLevel, String healthNotes, String profileImageUrl) {
        this.userId = userId;
        this.breed = breed;
        this.name = name;
        this.birthDate = birthDate;
        this.weight = weight;
        this.gender = gender;
        this.neutered = neutered;
        this.activityLevel = activityLevel;
        this.healthNotes = healthNotes;
        this.profileImageUrl = profileImageUrl;
    }

    public static Dog create(Long userId, DogBreed breed, String name, LocalDate birthDate,
                             BigDecimal weight, Gender gender, boolean neutered,
                             ActivityLevel activityLevel, String healthNotes, String profileImageUrl) {
        return Dog.builder()
                .userId(userId)
                .breed(breed)
                .name(name)
                .birthDate(birthDate)
                .weight(weight)
                .gender(gender)
                .neutered(neutered)
                .activityLevel(activityLevel)
                .healthNotes(healthNotes)
                .profileImageUrl(profileImageUrl)
                .build();
    }

    /** 프로필 수정. {@code null} 인 인자는 변경하지 않는다 (부분 수정 = PATCH 의미). */
    public void updateProfile(DogBreed breed, String name, LocalDate birthDate,
                              BigDecimal weight, Gender gender, Boolean neutered,
                              ActivityLevel activityLevel, String healthNotes, String profileImageUrl) {
        if (breed != null) this.breed = breed;
        if (name != null) this.name = name;
        if (birthDate != null) this.birthDate = birthDate;
        if (weight != null) this.weight = weight;
        if (gender != null) this.gender = gender;
        if (neutered != null) this.neutered = neutered;
        if (activityLevel != null) this.activityLevel = activityLevel;
        if (healthNotes != null) this.healthNotes = healthNotes;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /** 호출자가 소유자인지 확인. 권한 위반 시 Service 에서 예외를 던지도록 한다. */
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
