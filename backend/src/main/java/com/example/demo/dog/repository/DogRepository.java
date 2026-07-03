package com.example.demo.dog.repository;

import com.example.demo.dog.entity.Dog;
import org.springframework.data.jpa.repository.EntityGraph;
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

    /**
     * ID 조회 + 견종 즉시 로딩(fetch join).
     * 산책점수 계산처럼 트랜잭션 밖에서 breed 를 읽는 경로용 — 지연 프록시를 남기지 않아
     * 세션이 닫힌 뒤(외부 API 실패로 EntityManager 가 무효화된 경우 등)에도
     * LazyInitializationException 이 발생하지 않는다.
     */
    @EntityGraph(attributePaths = "breed")
    Optional<Dog> findWithBreedByIdAndUserId(
            Long dogId,
            Long userId
    );

    /** 현재 대표 강아지. 유저당 1마리 강제이므로 단건. */
    Optional<Dog> findByUserIdAndMainTrue(Long userId);

    /** 소유 반려견 수. 첫 등록견 자동 대표 지정 판단에 사용. */
    long countByUserId(Long userId);
}
