package com.example.demo.community.dto;

import lombok.Getter;

@Getter
public class CreateCommentRequest {

    private String content;

    private Long parentCommentId;
}
