package com.example.demo.dog.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.dto.DogCreateRequest;
import com.example.demo.dog.dto.DogResponse;
import com.example.demo.dog.dto.DogUpdateRequest;
import com.example.demo.dog.dto.WalkTimeCodec;
import com.example.demo.dog.entity.ActivityLevel;
import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.repository.DogBreedRepository;
import com.example.demo.dog.repository.DogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DogService {

    private final DogRepository dogRepository;
    private final DogBreedRepository dogBreedRepository;

    public List<DogResponse> findMyDogs(Long userId) {
        return dogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(DogResponse::from)
                .toList();
    }

    public DogResponse findOne(Long userId, Long dogId) {
        Dog dog = getMyDog(userId, dogId);
        return DogResponse.from(dog);
    }

    @Transactional
    public DogResponse register(Long userId, DogCreateRequest request) {
        DogBreed breed = resolveBreed(request.breedId());
        // 첫 등록견은 자동 대표. 이후엔 isMain=true 요청 시에만 대표.
        boolean firstDog = dogRepository.countByUserId(userId) == 0;
        boolean shouldBeMain = firstDog || Boolean.TRUE.equals(request.isMain());
        if (shouldBeMain) {
            clearCurrentMain(userId);
        }
        Dog dog = Dog.create(
                userId,
                breed,
                request.name(),
                request.birthDate(),
                request.weight(),
                request.gender(),
                Boolean.TRUE.equals(request.isNeutered()),
                shouldBeMain,
                ActivityLevel.fromLabel(request.activityLevel()),
                request.healthNotes(),
                request.profileImageUrl(),
                WalkTimeCodec.toCsv(request.favorWalkTime())
        );
        Dog saved = dogRepository.save(dog);
        return DogResponse.from(saved);
    }

    @Transactional
    public DogResponse update(Long userId, Long dogId, DogUpdateRequest request) {
        Dog dog = getMyDog(userId, dogId);
        DogBreed breed = request.breedId() == null ? null : resolveBreed(request.breedId());
        ActivityLevel activityLevel = request.activityLevel() == null
                ? null
                : ActivityLevel.fromLabel(request.activityLevel());
        dog.updateProfile(
                breed,
                request.name(),
                request.birthDate(),
                request.weight(),
                request.gender(),
                request.isNeutered(),
                activityLevel,
                request.healthNotes(),
                request.profileImageUrl()
        );
        // favorWalkTime: null=변경 없음, []=전체 해제. null-skip 과 분리 처리.
        if (request.favorWalkTime() != null) {
            dog.changeFavorWalkTime(WalkTimeCodec.toCsv(request.favorWalkTime()));
        }
        // 대표 지정 요청 시에만 전환(유저당 1마리 강제). false 로 직접 해제는 막아 무대표 상태 방지.
        if (Boolean.TRUE.equals(request.isMain()) && !dog.isMain()) {
            clearCurrentMain(userId);
            dog.markAsMain();
        }
        return DogResponse.from(dog);
    }

    @Transactional
    public void delete(Long userId, Long dogId) {
        Dog dog = getMyDog(userId, dogId);
        boolean wasMain = dog.isMain();
        dog.softDelete();
        // 대표견 삭제 시 무대표 방지 — 남은 견 중 가장 최근 등록견을 자동 대표로 승격.
        if (wasMain) {
            dogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .findFirst()
                    .ifPresent(Dog::markAsMain);
        }
    }

    private Dog getMyDog(Long userId, Long dogId) {
        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        if (!dog.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_DOG);
        }
        return dog;
    }

    /** 현재 대표 강아지가 있으면 해제. 유저당 대표 1마리 강제용. */
    private void clearCurrentMain(Long userId) {
        dogRepository.findByUserIdAndMainTrue(userId).ifPresent(Dog::unsetMain);
    }

    private DogBreed resolveBreed(Long breedId) {
        if (breedId == null) {
            return null;
        }
        return dogBreedRepository.findById(breedId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BREED_NOT_FOUND));
    }
}
