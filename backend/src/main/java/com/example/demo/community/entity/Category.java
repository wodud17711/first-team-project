package com.example.demo.community.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Arrays;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(name = "sub_tags", columnDefinition = "json")
    private String subTags;

    @Column(name = "display_order")
    private Integer displayOrder;

    // ✅ 추가: subTag 파싱 헬퍼
    public List<String> getSubTagList() {
        if (subTags == null || subTags.isBlank()) {
            return List.of();
        }

        return Arrays.stream(
                subTags.replace("[", "")
                        .replace("]", "")
                        .replace("\"", "")
                        .split(",")
        ).map(String::trim).toList();
    }
}