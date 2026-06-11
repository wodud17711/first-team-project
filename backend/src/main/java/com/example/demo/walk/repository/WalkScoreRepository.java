package com.example.demo.walk.repository;

import com.example.demo.walk.domain.WalkScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WalkScoreRepository
        extends JpaRepository<WalkScore, Long> {
    List<WalkScore> findByDogId(Long dogId);

    /**
     * 산책에 아직 연결되지 않은(walk_id NULL) 점수 중, 해당 반려견의 기준 시각 이후 측정된 가장 최신 1건.
     *
     * <p>산책 시작 시 직전 조회 점수를 그 산책에 귀속(A-2)하기 위해 사용한다.
     */
    Optional<WalkScore> findTopByDogIdAndWalkIdIsNullAndMeasuredAtAfterOrderByMeasuredAtDesc(
            Long dogId, LocalDateTime threshold);
}
