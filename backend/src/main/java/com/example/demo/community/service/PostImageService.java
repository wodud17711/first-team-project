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
    public Long addImage(
            Long postId,
            Long userId,
            CreatePostImageRequest request
    ) {


        Post post =
                postRepository.findById(postId)
                        .orElseThrow(() ->
                                new BusinessException(
                                        ErrorCode.POST_NOT_FOUND
                                )
                        );


        if (!post.getUser().getId().equals(userId)) {

            throw new BusinessException(
                    ErrorCode.FORBIDDEN
            );
        }


        PostImage image =
                PostImage.builder()
                        .post(post)
                        .imageUrl(request.imageUrl())
                        .build();


        return postImageRepository
                .save(image)
                .getId();
    }



    @Transactional(readOnly = true)
    public List<PostImage> getImages(
            Long postId
    ) {

        return postImageRepository
                .findByPostIdOrderByCreatedAtAsc(
                        postId
                );
    }
}