package com.example.demo.community.dto;

import com.example.demo.community.entity.Category;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private List<String> subTags;

    public static CategoryResponse from(Category category) {
        try {
            return CategoryResponse.builder()
                    .id(category.getId())
                    .name(category.getName())
                    .subTags(category.getSubTagList())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException(
                    "카테고리 subTag 파싱 실패. categoryId="
                            + category.getId(),
                    e
            );
        }
    }
}