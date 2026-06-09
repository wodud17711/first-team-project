package com.example.demo.walk.repository;

import com.example.demo.walk.domain.Walk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalkRepository extends JpaRepository<Walk, Long> {

    /** 특정 반려견의 산책 이력. 최신 시작순. {@code @SQLRestriction} 으로 soft delete 제외. */
    List<Walk> findByDogIdOrderByStartTimeDesc(Long dogId);

    /** 해당 반려견의 미종료(진행 중) 산책. 중복 시작 방지에 사용 (반려견당 1건). */
    Optional<Walk> findByDogIdAndEndTimeIsNull(Long dogId);
}
