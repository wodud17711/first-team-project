package com.example.demo.community.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.community.entity.Post;
import com.example.demo.community.entity.PostImage;
import com.example.demo.community.repository.PostImageRepository;
import com.example.demo.community.repository.PostRepository;
import com.example.demo.community.dto.CreatePostImageRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PostImageService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;

    /**
     * 게시글 이미지 추가
     */
    public Long addImage(Long postId, Long userId, CreatePostImageRequest request) {

        // 게시글 존재 여부 확인
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        // 작성자 권한 확인
        if (!post.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_YOUR_POST);
        }

        // URL 검증 (추가적인 비즈니스 규칙)
        String imageUrl = request.imageUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (imageUrl.length() > 500) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (!(imageUrl.endsWith(".jpg") || imageUrl.endsWith(".png")
                || imageUrl.endsWith(".jpeg") || imageUrl.endsWith(".webp"))) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }

        PostImage image = PostImage.builder()
                .post(post)
                .imageUrl(imageUrl)
                .build();

        return postImageRepository.save(image).getId();
    }

    /**
     * 게시글 이미지 조회
     */
    @Transactional(readOnly = true)
    public List<PostImage> getImages(Long postId) {
        return postImageRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }
}
