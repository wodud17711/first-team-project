package com.example.demo.user.repository;

import com.example.demo.user.entity.User;
import com.example.demo.user.type.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    // 소셜 로그인: (provider, provider_id) 로 기존 가입자 조회.
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}