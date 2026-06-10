package com.example.demo.community.repository;

import com.example.demo.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    List<Comment> findByPost_IdAndDeletedAtIsNullOrderByCreatedAtAsc(
            Long postId
    );

    List<Comment> findByParentComment_Id(
            Long parentId
    );
}
