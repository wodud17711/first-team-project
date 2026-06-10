package com.example.demo.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePostRequest {

    @NotNull
    private Long categoryId;

    private String subTag;

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
