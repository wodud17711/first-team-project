package com.example.demo.community.entity;

import com.example.demo.user.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "post_likes",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "post_id",
                                "user_id"
                        }
                )
        }
)
public class PostLike {
    private Long id;

    private User user;

    private Post post;

    private LocalDateTime createdAt;
}
