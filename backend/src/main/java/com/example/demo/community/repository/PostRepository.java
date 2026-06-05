package com.example.demo.community.repository;

import com.example.demo.community.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository
        extends JpaRepository<Post, Long> {
}