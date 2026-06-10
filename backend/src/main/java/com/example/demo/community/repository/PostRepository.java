package com.example.demo.community.repository;

import com.example.demo.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.awt.print.Pageable;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategoryIdAndDeletedAtIsNull(
            Long categoryId,
            Pageable pageable
    );

    Page<Post> findByCategoryIdAndSubTagAndDeletedAtIsNull(
            Long categoryId,
            String subTag,
            Pageable pageable
    );
}