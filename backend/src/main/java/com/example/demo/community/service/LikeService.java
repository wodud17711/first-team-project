package com.example.demo.community.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.dto.LikeResponse;
import com.example.demo.community.entity.Post;
import com.example.demo.community.entity.PostLike;
import com.example.demo.community.repository.PostLikeRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final NotificationService notificationService;

    public LikeResponse toggleLike(
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

            return LikeResponse.builder()
                    .postId(postId)
                    .likeCount(post.getLikeCount())
                    .liked(false)
                    .build();
        }

        try {

            PostLike like = PostLike.builder()
                    .user(user)
                    .post(post)
                    .build();

            postLikeRepository.save(like);

        } catch (DataIntegrityViolationException e) {

            return LikeResponse.builder()
                    .postId(postId)
                    .likeCount(post.getLikeCount())
                    .liked(true)
                    .build();
        }

        post.increaseLikeCount();

        // 내 글에 눌린 좋아요 → 글 작성자에게 알림 (자기 좋아요면 NotificationService 에서 skip)
        notificationService.notifyNewLike(post, user);

        return LikeResponse.builder()
                .postId(postId)
                .likeCount(post.getLikeCount())
                .liked(true)
                .build();
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
