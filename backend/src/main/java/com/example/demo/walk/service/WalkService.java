package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.domain.Walk;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.dto.WalkEndRequest;
import com.example.demo.walk.dto.WalkResponse;
import com.example.demo.walk.repository.WalkRepository;
import com.example.demo.walk.repository.WalkScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 산책 기록 시작/종료/이력.
 *
 * <p>소유권은 두 단계로 검증한다: 반려견 소유(start·history)는 {@link #getMyDog},
 * 산책 기록 소유(end)는 {@link #getMyWalk}. 둘 다 위반 시 403.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Walk (산책 기록)" 섹션.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkService {

    /** 산책 시작 시 귀속할 직전 위험도 점수의 유효 시간(분). 이보다 오래된 점수는 연결하지 않는다(A-2 정책). */
    private static final long SCORE_LINK_WINDOW_MINUTES = 30;

    private final WalkRepository walkRepository;
    private final DogRepository dogRepository;
    private final WalkScoreRepository walkScoreRepository;

    @Transactional
    public WalkResponse start(Long userId, Long dogId) {
        Dog dog = getMyDog(userId, dogId);
        // 미종료 산책 중복 시작 방지 (반려견당 1건). 진행 중이면 409.
        walkRepository.findByDogIdAndEndTimeIsNull(dogId).ifPresent(w -> {
            throw new BusinessException(ErrorCode.WALK_ALREADY_IN_PROGRESS);
        });
        Walk walk = walkRepository.save(Walk.start(userId, dog));
        linkRecentScore(dogId, walk.getId());
        return WalkResponse.from(walk);
    }

    /**
     * 산책 시작 시점에 직전 조회 점수를 그 산책에 귀속한다(A-2).
     *
     * <p>해당 반려견의 미연결(walk_id NULL) 점수 중 최근 {@value #SCORE_LINK_WINDOW_MINUTES}분 이내
     * 가장 최신 1건만 연결한다. 윈도우 내 점수가 없으면 연결하지 않는다(walk_id NULL 유지).
     * 같은 트랜잭션 내 더티 체킹으로 반영된다.
     */
    private void linkRecentScore(Long dogId, Long walkId) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(SCORE_LINK_WINDOW_MINUTES);
        walkScoreRepository
                .findTopByDogIdAndWalkIdIsNullAndMeasuredAtAfterOrderByMeasuredAtDesc(dogId, threshold)
                .ifPresent(score -> score.linkTo(walkId));
    }

    @Transactional
    public WalkResponse end(Long userId, Long walkId, WalkEndRequest request) {
        Walk walk = getMyWalk(userId, walkId);
        if (request == null) {
            request = new WalkEndRequest(null, null, null);
        }
        walk.end(request.distanceKm(), request.memo(), request.userFeedback());
        return WalkResponse.from(walk);
    }

    public List<WalkResponse> history(Long userId, Long dogId) {
        getMyDog(userId, dogId);
        return walkRepository.findByDogIdOrderByStartTimeDesc(dogId).stream()
                .map(WalkResponse::from)
                .toList();
    }

    private Dog getMyDog(Long userId, Long dogId) {
        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        if (!dog.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_DOG);
        }
        return dog;
    }

    private Walk getMyWalk(Long userId, Long walkId) {
        Walk walk = walkRepository.findById(walkId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALK_NOT_FOUND));
        if (!walk.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return walk;
    }
}
