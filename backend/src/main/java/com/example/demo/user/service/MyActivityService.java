package com.example.demo.user.service;

import com.example.demo.community.dto.PostSummaryResponse;
import com.example.demo.community.entity.PostLike;
import com.example.demo.community.repository.CommentRepository;
import com.example.demo.community.repository.PostLikeRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.user.dto.MyCommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyActivityService {


    private final PostRepository postRepository;

    private final CommentRepository commentRepository;

    private final PostLikeRepository postLikeRepository;


    /**
     * 내가 작성한 게시글 목록
     *
     * GET /api/users/me/posts
     */
    public Page<PostSummaryResponse> getMyPosts(
            Long userId,
            int page,
            int size
    ) {

        Pageable pageable = createPageable(page, size);

        return postRepository
                .findByUser_IdAndDeletedAtIsNull(
                        userId,
                        pageable
                )
                .map(post ->
                        PostSummaryResponse.from(
                                post,
                                false
                        )
                );
    }


    /**
     * 내가 작성한 댓글 목록
     *
     * GET /api/users/me/comments
     */
    public Page<MyCommentResponse> getMyComments(
            Long userId,
            int page,
            int size
    ) {

        Pageable pageable = createPageable(page, size);

        return commentRepository
                .findByUser_IdAndPost_DeletedAtIsNull(
                        userId,
                        pageable
                )
                .map(MyCommentResponse::from);
    }


    /**
     * 내가 좋아요한 게시글 목록
     *
     * GET /api/users/me/likes
     */
    public Page<PostSummaryResponse> getMyLikes(
            Long userId,
            int page,
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        return postLikeRepository
                .findByUser_IdAndPost_DeletedAtIsNullOrderByCreatedAtDesc(
                        userId,
                        pageable
                )
                .map(PostLike::getPost)
                .map(post ->
                        PostSummaryResponse.from(
                                post,
                                true
                        )
                );
    }


    /**
     * 페이지 공통 생성
     */
    private Pageable createPageable(
            int page,
            int size
    ) {

        return PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );
    }
}
