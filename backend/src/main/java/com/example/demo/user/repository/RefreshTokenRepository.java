package com.example.demo.user.repository;

import com.example.demo.user.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);

    void deleteByUser_Id(Long userId);
}