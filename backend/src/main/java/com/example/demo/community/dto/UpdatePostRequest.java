package com.example.demo.community.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePostRequest {

    private String subTag;

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}