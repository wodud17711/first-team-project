package com.example.demo.dog.repository;

import com.example.demo.dog.entity.DogBreed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DogBreedRepository extends JpaRepository<DogBreed, Long> {

    /** 드롭다운 검색용. {@code nameKr} 부분 일치 (case-sensitive) 조회. */
    List<DogBreed> findByNameKrContainingOrderByNameKrAsc(String nameKr);
}
