package com.example.demo.walk.repository;

import com.example.demo.walk.domain.WalkScore;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalkScoreRepository
        extends JpaRepository<WalkScore, Long> {
}
