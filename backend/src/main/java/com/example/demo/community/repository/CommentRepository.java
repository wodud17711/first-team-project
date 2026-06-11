package com.example.demo.community.repository;

import com.example.demo.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    /**
     * 게시글의 댓글 전체 조회
     */
    List<Comment> findByPost_IdAndDeletedAtIsNullOrderByCreatedAtAsc(
            Long postId
    );

    List<Comment> findByParentComment_Id(
            Long parentCommentId
    );

    /**
     * 특정 댓글의 대댓글 조회
     */
    List<Comment> findByParentComment_IdAndDeletedAtIsNullOrderByCreatedAtAsc(
            Long parentCommentId
    );

    // 내가 작성한 댓글
    // 삭제된 원글 제외
    Page<Comment> findByUser_IdAndPost_DeletedAtIsNull(
            Long userId,
            Pageable pageable
    );
}