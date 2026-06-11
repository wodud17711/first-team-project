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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * 댓글 작성 (대댓글 포함)
     */
    public Long createComment(Long postId, CreateCommentRequest request, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        Comment parent = commentRepository.findById(
                request.getParentCommentId()
        ).orElseThrow(
                () -> new BusinessException(
                        ErrorCode.COMMENT_NOT_FOUND
                )
        );

        if (parent.getParentComment() != null) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT
            );
        }

        if (!parent.getPost()
                .getId()
                .equals(postId)) {

            throw new BusinessException(
                    ErrorCode.INVALID_INPUT
            );
        }

        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        }

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .parentComment(parent)
                .content(request.getContent())
                .build();

        Comment saved = commentRepository.save(comment);

        post.increaseCommentCount();

        return saved.getId();
    }

    /**
     * 댓글 목록 (트리 구조)
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId, Long loginUserId) {

        List<Comment> comments =
                commentRepository.findByPost_IdAndDeletedAtIsNullOrderByCreatedAtAsc(postId);

        // 1) DTO 변환 Map
        Map<Long, CommentResponse> map = new LinkedHashMap<>();

        // 2) 먼저 전체 댓글 DTO로 변환 (replies 비워둠)
        for (Comment c : comments) {
            map.put(
                    c.getId(),
                    CommentResponse.from(c, loginUserId, new ArrayList<>())
            );
        }

        // 3) 트리 구조 생성
        List<CommentResponse> roots = new ArrayList<>();

        for (Comment c : comments) {

            CommentResponse current = map.get(c.getId());

            if (c.getParentComment() == null) {
                roots.add(current);
            } else {
                CommentResponse parent = map.get(c.getParentComment().getId());

                if (parent != null) {
                    parent.getReplies().add(current);
                }
            }
        }

        return roots;
    }

    /**
     * 댓글 수정
     */
    public void updateComment(Long commentId, UpdateCommentRequest request, Long userId) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        validateOwner(comment, userId);

        comment.updateContent(request.getContent());
    }

    /**
     * 댓글 삭제 (soft delete)
     */
    public void deleteComment(Long commentId, Long userId) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        validateOwner(comment, userId);

        Post post = comment.getPost();

        List<Comment> replies =
                commentRepository
                        .findByParentComment_Id(
                                comment.getId()
                        );

        for (Comment reply : replies) {
            reply.softDelete();
            post.decreaseCommentCount();
        }

        comment.softDelete();
        post.decreaseCommentCount();
    }

    /**
     * 작성자 검증
     */
    private void validateOwner(Comment comment, Long userId) {

        if (!comment.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_POST);
        }
    }
}