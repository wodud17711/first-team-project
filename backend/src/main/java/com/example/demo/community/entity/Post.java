package com.example.demo.community.entity;

import com.example.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "posts",
        indexes = {
                @Index(name = "idx_posts_category_id", columnList = "category_id"),
                @Index(name = "idx_posts_created_at", columnList = "created_at"),
                @Index(name = "idx_posts_user_id", columnList = "user_id")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 카테고리
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "sub_tag", length = 20)
    private String subTag;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    private String content;

    @Builder.Default
    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Builder.Default
    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Builder.Default
    @Column(name = "comment_count")
    private Integer commentCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
