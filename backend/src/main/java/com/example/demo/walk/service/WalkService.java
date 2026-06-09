package com.example.demo.walk.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.domain.Walk;
import com.example.demo.walk.dto.WalkEndRequest;
import com.example.demo.walk.dto.WalkResponse;
import com.example.demo.walk.repository.WalkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final WalkRepository walkRepository;
    private final DogRepository dogRepository;

    @Transactional
    public WalkResponse start(Long userId, Long dogId) {
        Dog dog = getMyDog(userId, dogId);
        // 미종료 산책 중복 시작 방지 (반려견당 1건). 진행 중이면 409.
        walkRepository.findByDogIdAndEndTimeIsNull(dogId).ifPresent(w -> {
            throw new BusinessException(ErrorCode.WALK_ALREADY_IN_PROGRESS);
        });
        Walk walk = walkRepository.save(Walk.start(userId, dog));
        return WalkResponse.from(walk);
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
