package com.example.demo.community.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.dto.*;
import com.example.demo.community.entity.Category;
import com.example.demo.community.entity.Post;
import com.example.demo.community.repository.CategoryRepository;
import com.example.demo.community.repository.PostLikeRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.community.dto.CreatePostResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;

    /**
     * 게시글 작성
     */
    public CreatePostResponse createPost(
            CreatePostRequest request,
            Long userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.USER_NOT_FOUND
                        )
                );

        Category category = categoryRepository.findById(
                        request.getCategoryId()
                )
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.CATEGORY_NOT_FOUND
                        )
                );

        validateSubTag(
                category,
                request.getSubTag()
        );

        Post post = Post.builder()
                .user(user)
                .category(category)
                .subTag(request.getSubTag())
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        Post savedPost = postRepository.save(post);

        return CreatePostResponse.builder()
                .postId(savedPost.getId())
                .category(savedPost.getCategory().getName())
                .subTag(savedPost.getSubTag())
                .title(savedPost.getTitle())
                .createdAt(savedPost.getCreatedAt())
                .build();
    }

    /**
     * 게시글 상세 조회
     */
    @Transactional
    public PostResponse getPost(
            Long postId,
            Long userId
    ) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.POST_NOT_FOUND
                        )
                );

        post.increaseViewCount();

        boolean liked = false;

        if (userId != null) {
            liked = postLikeRepository
                    .existsByUser_IdAndPost_Id(
                            userId,
                            postId
                    );
        }

        return PostResponse.from(
                post,
                liked
        );
    }

    /**
     * 게시글 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<PostSummaryResponse> getPosts(
            Long categoryId,
            String subTag,
            int page,
            Long userId
    ) {

        Pageable pageable = PageRequest.of(
                page,
                20,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        Page<Post> posts;

        if (categoryId == null) {

            posts =
                    postRepository
                            .findByDeletedAtIsNull(
                                    pageable
                            );

        }
        else if (subTag == null || subTag.isBlank()) {

            posts =
                    postRepository
                            .findByCategory_IdAndDeletedAtIsNull(
                                    categoryId,
                                    pageable
                            );

        }
        else {

            posts =
                    postRepository
                            .findByCategory_IdAndSubTagAndDeletedAtIsNull(
                                    categoryId,
                                    subTag,
                                    pageable
                            );
        }

        return posts.map(post -> {

            boolean liked = false;

            if (userId != null) {
                liked = postLikeRepository
                        .existsByUser_IdAndPost_Id(
                                userId,
                                post.getId()
                        );
            }

            return PostSummaryResponse.from(
                    post,
                    liked
            );
        });
    }

    /**
     * 게시글 수정
     */
    public void updatePost(
            Long postId,
            UpdatePostRequest request,
            Long userId
    ) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.POST_NOT_FOUND
                        )
                );

        validateOwner(
                post,
                userId
        );

        validateSubTag(
                post.getCategory(),
                request.getSubTag()
        );

        post.setSubTag(
                request.getSubTag()
        );

        post.setTitle(
                request.getTitle()
        );

        post.setContent(
                request.getContent()
        );
    }

    /**
     * 게시글 삭제
     */
    public void deletePost(
            Long postId,
            Long userId
    ) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.POST_NOT_FOUND
                        )
                );

        validateOwner(
                post,
                userId
        );

        post.softDelete();
    }

    /**
     * 작성자 검증
     */
    private void validateOwner(
            Post post,
            Long userId
    ) {

        if (!post.getUser()
                .getId()
                .equals(userId)) {

            throw new BusinessException(
                    ErrorCode.NOT_YOUR_POST
            );
        }
    }

    /**
     * 서브태그 검증
     */
    private void validateSubTag(
            Category category,
            String subTag
    ) {

        List<String> allowedTags =
                category.getSubTagList();

        // 서브태그 없는 카테고리
        if (allowedTags.isEmpty()) {

            if (subTag != null &&
                    !subTag.isBlank()) {

                throw new BusinessException(
                        ErrorCode.INVALID_SUB_TAG
                );
            }

            return;
        }

        // 허용되지 않은 서브태그
        if (!allowedTags.contains(subTag)) {

            throw new BusinessException(
                    ErrorCode.INVALID_SUB_TAG
            );
        }
    }
}