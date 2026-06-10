package com.example.demo.community.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.dto.CommentResponse;
import com.example.demo.community.dto.CreateCommentRequest;
import com.example.demo.community.dto.UpdateCommentRequest;
import com.example.demo.community.entity.Comment;
import com.example.demo.community.entity.Post;
import com.example.demo.community.repository.CommentRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * 댓글 작성
     */
    public Long createComment(
            Long postId,
            CreateCommentRequest request,
            Long userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.USER_NOT_FOUND
                        )
                );

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new BusinessException(
                                ErrorCode.POST_NOT_FOUND
                        )
                );

        Comment parentComment = null;

        if (request.getParentCommentId() != null) {

            parentComment = commentRepository.findById(
                            request.getParentCommentId()
                    )
                    .orElseThrow(() ->
                            new BusinessException(
                                    ErrorCode.COMMENT_NOT_FOUND
                            )
                    );
        }

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .parentComment(parentComment)
                .content(request.getContent())
                .build();

        commentRepository.save(comment);

        post.increaseCommentCount();

        return comment.getId();
    }

    /**
     * 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(
            Long postId,
            Long loginUserId
    ) {

        List<Comment> comments =
                commentRepository
                        .findByPost_IdAndDeletedAtIsNullOrderByCreatedAtAsc(
                                postId
                        );

        return comments.stream()
                .filter(comment ->
                        comment.getParentComment() == null
                )
                .map(parent -> {

                    List<CommentResponse> replies =
                            commentRepository
                                    .findByParentComment_IdAndDeletedAtIsNullOrderByCreatedAtAsc(
                                            parent.getId()
                                    )
                                    .stream()
                                    .map(reply ->
                                            CommentResponse.from(
                                                    reply,
                                                    loginUserId,
                                                    List.of()
                                            )
                                    )
                                    .toList();

                    return CommentResponse.from(
                            parent,
                            loginUserId,
                            replies
                    );

                })
                .toList();
    }

    /**
     * 댓글 수정
     */
    public void updateComment(
            Long commentId,
            UpdateCommentRequest request,
            Long userId
    ) {

        Comment comment =
                commentRepository.findById(commentId)
                        .orElseThrow(() ->
                                new BusinessException(
                                        ErrorCode.COMMENT_NOT_FOUND
                                )
                        );

        validateOwner(
                comment,
                userId
        );

        comment.updateContent(
                request.getContent()
        );
    }

    /**
     * 댓글 삭제
     */
    public void deleteComment(
            Long commentId,
            Long userId
    ) {

        Comment comment =
                commentRepository.findById(commentId)
                        .orElseThrow(() ->
                                new BusinessException(
                                        ErrorCode.COMMENT_NOT_FOUND
                                )
                        );

        validateOwner(
                comment,
                userId
        );

        comment.softDelete();

        comment.getPost()
                .decreaseCommentCount();
    }

    /**
     * 작성자 검증
     */
    private void validateOwner(
            Comment comment,
            Long userId
    ) {

        if (!comment.getUser()
                .getId()
                .equals(userId)) {

            throw new BusinessException(
                    ErrorCode.COMMENT_NOT_FOUND
            );
        }
    }
}