package com.example.demo.community.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.entity.Post;
import com.example.demo.community.entity.PostLike;
import com.example.demo.community.repository.PostLikeRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;

    public boolean toggleLike(
            Long postId,
            Long userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.USER_NOT_FOUND
                        ));

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.POST_NOT_FOUND
                        ));

        PostLike existing =
                postLikeRepository
                        .findByUser_IdAndPost_Id(
                                userId,
                                postId
                        )
                        .orElse(null);

        if (existing != null) {

            postLikeRepository.delete(existing);

            post.decreaseLikeCount();

            return false;
        }

        PostLike like = PostLike.builder()
                .user(user)
                .post(post)
                .build();

        postLikeRepository.save(like);

        post.increaseLikeCount();

        return true;
    }

    @Transactional(readOnly = true)
    public boolean isLiked(
            Long userId,
            Long postId
    ) {

        return postLikeRepository
                .existsByUser_IdAndPost_Id(
                        userId,
                        postId
                );
    }
}
