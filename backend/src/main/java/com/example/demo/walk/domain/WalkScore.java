package com.example.demo.walk.domain;

import com.example.demo.dog.entity.Dog;
import com.example.demo.weather.domain.WeatherSnapshot;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "walk_scores")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // walk_id
    @Column(name = "walk_id")
    private Long walkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "dog_id",
            nullable = false
    )
    private Dog dog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weather_snapshot_id")
    private WeatherSnapshot weatherSnapshot;

    @Column
    private Integer score;

    @Column
    private String level;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    @Builder
    private WalkScore(
            Long walkId,
            Dog dog,
            WeatherSnapshot weatherSnapshot,
            Integer score,
            String level,
            String reason,
            LocalDateTime measuredAt
    ) {
        this.walkId = walkId;
        this.dog = dog;
        this.weatherSnapshot = weatherSnapshot;
        this.score = score;
        this.level = level;
        this.reason = reason;
        this.measuredAt = measuredAt;
    }

    public static WalkScore create(
            Dog dog,
            WeatherSnapshot weatherSnapshot,
            Integer score,
            String level,
            String reason
    ) {
        return WalkScore.builder()
                .dog(dog)
                .weatherSnapshot(weatherSnapshot)
                .score(score)
                .level(level)
                .reason(reason)
                .measuredAt(LocalDateTime.now())
                .build();
    }

    /**
     * 이 점수를 특정 산책에 귀속한다(walk_id 연결).
     *
     * <p>산책 시작 시 직전에 조회만 했던 점수(walk_id NULL)를 그 산책의 스냅샷으로 연결할 때 사용한다.
     */
    public void linkTo(Long walkId) {
        this.walkId = walkId;
    }
}
