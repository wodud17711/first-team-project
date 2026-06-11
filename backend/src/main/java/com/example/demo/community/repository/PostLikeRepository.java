package com.example.demo.community.repository;

import com.example.demo.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository
        extends JpaRepository<PostLike, Long> {

    boolean existsByPost_IdAndUser_Id(
            Long postId,
            Long userId
    );

    Optional<PostLike> findByPost_IdAndUser_Id(
            Long postId,
            Long userId
    );

    long countByPost_Id(Long postId);
}
