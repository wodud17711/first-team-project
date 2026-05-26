package com.example.demo.dog.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.dto.DogCreateRequest;
import com.example.demo.dog.dto.DogResponse;
import com.example.demo.dog.dto.DogUpdateRequest;
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
        Dog dog = Dog.create(
                userId,
                breed,
                request.name(),
                request.birthDate(),
                request.weight(),
                request.gender(),
                Boolean.TRUE.equals(request.isNeutered()),
                ActivityLevel.fromLabel(request.activityLevel()),
                request.healthNotes(),
                request.profileImageUrl()
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
        return DogResponse.from(dog);
    }

    @Transactional
    public void delete(Long userId, Long dogId) {
        Dog dog = getMyDog(userId, dogId);
        dog.softDelete();
    }

    private Dog getMyDog(Long userId, Long dogId) {
        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        if (!dog.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_DOG);
        }
        return dog;
    }

    private DogBreed resolveBreed(Long breedId) {
        if (breedId == null) {
            return null;
        }
        return dogBreedRepository.findById(breedId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BREED_NOT_FOUND));
    }
}
