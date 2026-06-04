package com.example.demo.dog.repository;

import com.example.demo.dog.entity.Dog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DogRepository extends JpaRepository<Dog, Long> {

    /** 특정 소유자의 반려견 목록. 등록 순서 (최신이 위). */
    List<Dog> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** ID 조회. {@code @SQLRestriction} 으로 soft delete 된 행은 자동 제외된다. */
    Optional<Dog> findByIdAndUserId(
            Long dogId,
            Long userId
    );
}
