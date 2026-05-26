package com.example.demo.dog.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.dog.dto.BreedResponse;
import com.example.demo.dog.entity.DogBreed;
import com.example.demo.dog.repository.DogBreedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DogBreedService {

    private final DogBreedRepository dogBreedRepository;

    public List<BreedResponse> search(String keyword) {
        List<DogBreed> breeds = (keyword == null || keyword.isBlank())
                ? dogBreedRepository.findAll()
                : dogBreedRepository.findByNameKrContainingOrderByNameKrAsc(keyword.trim());
        return breeds.stream().map(BreedResponse::from).toList();
    }

    public BreedResponse findOne(Long breedId) {
        DogBreed breed = dogBreedRepository.findById(breedId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BREED_NOT_FOUND));
        return BreedResponse.from(breed);
    }
}
