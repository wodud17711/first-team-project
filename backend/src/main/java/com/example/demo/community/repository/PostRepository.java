package com.example.demo.community.repository;

import com.example.demo.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategory_IdAndDeletedAtIsNull(
            Long categoryId,
            Pageable pageable
    );

    Page<Post> findByCategory_IdAndSubTagAndDeletedAtIsNull(
            Long categoryId,
            String subTag,
            Pageable pageable
    );

    Page<Post> findByDeletedAtIsNull(
            Pageable pageable
    );

    // 내가 작성한 게시글
    Page<Post> findByUser_IdAndDeletedAtIsNull(
            Long userId,
            Pageable pageable
    );
}