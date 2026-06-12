package com.example.demo.community.repository;

import com.example.demo.community.entity.PostLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostLikeRepository
        extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByUser_IdAndPost_Id(
            Long userId,
            Long postId
    );

    boolean existsByUser_IdAndPost_Id(
            Long userId,
            Long postId
    );

    long countByPost_Id(Long postId);

    // 내가 좋아요한 게시글
    // 좋아요 누른 시간 최신순
    // 삭제된 게시글 제외
    @Query(
            value = """
                    select pl
                    from PostLike pl
                    join fetch pl.post p
                    where pl.user.id = :userId
                    and p.deletedAt is null
                    order by pl.createdAt desc
                    """,
            countQuery = """
                    select count(pl)
                    from PostLike pl
                    where pl.user.id = :userId
                    and pl.post.deletedAt is null
                    """
    )
    Page<PostLike> findMyLikes(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
