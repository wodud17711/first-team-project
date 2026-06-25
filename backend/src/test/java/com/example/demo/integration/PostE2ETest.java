package com.example.demo.integration;

import com.example.demo.community.entity.Category;
import com.example.demo.community.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PostE2ETest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CategoryRepository categoryRepository;


    /**
     * 최신순:
     * createdAt DESC
     */
    @Test
    @DisplayName("게시글 목록 latest 정렬 - createdAt DESC")
    void getPosts_latest_sort() throws Exception {

        String token =
                signupAndLogin(
                        "latest@test.com",
                        "최신테스트"
                );

        Long categoryId =
                createCategory();


        createPost(
                token,
                categoryId,
                "오래된 게시글"
        );

        Thread.sleep(100);


        createPost(
                token,
                categoryId,
                "최신 게시글"
        );


        JsonNode content =
                getPosts(
                        null,
                        "latest",
                        "10"
                );


        assertThat(
                content.get(0)
                        .get("title")
                        .asText()
        )
                .isEqualTo("최신 게시글");
    }



    /**
     * 인기순:
     * likeCount DESC
     */
    @Test
    @DisplayName("게시글 목록 popular 정렬 - likeCount DESC")
    void getPosts_popular_sort() throws Exception {

        String token =
                signupAndLogin(
                        "popular@test.com",
                        "인기테스트"
                );


        Long categoryId =
                createCategory();


        long lowPost =
                createPost(
                        token,
                        categoryId,
                        "좋아요 적은 글"
                );


        long highPost =
                createPost(
                        token,
                        categoryId,
                        "좋아요 많은 글"
                );


        likePost(token, highPost);


        JsonNode content =
                getPosts(
                        null,
                        "popular",
                        "10"
                );


        assertThat(
                content.get(0)
                        .get("title")
                        .asText()
        )
                .isEqualTo("좋아요 많은 글");
    }




    /**
     * popular:
     * likeCount 동일하면 createdAt DESC
     */
    @Test
    @DisplayName("popular 동점이면 createdAt DESC")
    void getPosts_popular_tiebreaker() throws Exception {

        String token =
                signupAndLogin(
                        "tie@test.com",
                        "동점테스트"
                );


        Long categoryId =
                createCategory();


        long oldPost =
                createPost(
                        token,
                        categoryId,
                        "인기 오래된 글"
                );

        likePost(token, oldPost);


        Thread.sleep(100);


        long newPost =
                createPost(
                        token,
                        categoryId,
                        "인기 최신 글"
                );

        likePost(token, newPost);



        JsonNode content =
                getPosts(
                        null,
                        "popular",
                        "10"
                );


        assertThat(
                content.get(0)
                        .get("title")
                        .asText()
        )
                .isEqualTo("인기 최신 글");


        assertThat(
                content.get(1)
                        .get("title")
                        .asText()
        )
                .isEqualTo("인기 오래된 글");
    }




    /**
     * size:
     * 기본 10
     */
    @Test
    @DisplayName("게시글 목록 size 파라미터 적용")
    void getPosts_size() throws Exception {

        String token =
                signupAndLogin(
                        "size@test.com",
                        "사이즈테스트"
                );


        Long categoryId =
                createCategory();


        for (int i = 0; i < 5; i++) {

            createPost(
                    token,
                    categoryId,
                    "게시글 " + i
            );
        }



        JsonNode content =
                getPosts(
                        null,
                        "latest",
                        "2"
                );


        assertThat(
                content.size()
        )
                .isEqualTo(2);
    }





    private String signupAndLogin(
            String email,
            String nickname
    ) throws Exception {


        mockMvc.perform(
                        post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email":"%s",
                                          "password":"password1234",
                                          "nickname":"%s"
                                        }
                                        """.formatted(email, nickname))
                )
                .andExpect(status().isOk());



        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {
                                                  "email":"%s",
                                                  "password":"password1234"
                                                }
                                                """.formatted(email))
                        )
                        .andExpect(status().isOk())
                        .andReturn();



        return objectMapper
                .readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .asText();
    }




    private Long createCategory() {

        Category category =
                Category.builder()
                        .name("자유게시판_" + System.nanoTime())
                        .subTags("[]")
                        .build();

        return categoryRepository.save(category)
                .getId();
    }





    private long createPost(
            String token,
            Long categoryId,
            String title
    ) throws Exception {


        MvcResult result =
                mockMvc.perform(
                                post("/api/posts")
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                                        .contentType(
                                                MediaType.APPLICATION_JSON
                                        )
                                        .content("""
                                                {
                                                  "categoryId": %d,
                                                  "title": "%s",
                                                  "content": "테스트 내용"
                                                }
                                                """.formatted(
                                                categoryId,
                                                title
                                        ))
                        )
                        .andExpect(status().isOk())
                        .andReturn();



        JsonNode data =
                objectMapper.readTree(
                                result.getResponse()
                                        .getContentAsString()
                        )
                        .get("data");


        return data.get("postId")
                .asLong();
    }




    private void likePost(
            String token,
            long postId
    ) throws Exception {


        mockMvc.perform(
                        post("/api/posts/" + postId + "/likes")
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk());
    }





    private JsonNode getPosts(
            Long categoryId,
            String sort,
            String size
    ) throws Exception {


        var request =
                get("/api/posts")
                        .param("sort", sort)
                        .param("size", size);


        if (categoryId != null) {
            request.param(
                    "categoryId",
                    String.valueOf(categoryId)
            );
        }



        MvcResult result =
                mockMvc.perform(request)
                        .andExpect(status().isOk())
                        .andReturn();



        return objectMapper
                .readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .get("content");
    }

    @Test
    @DisplayName("게시글 목록 size 적용 및 페이지 경계 중복·누락 검증")
    void getPosts_pageBoundary_noDuplicateOrMissing() throws Exception {

        String token =
                signupAndLogin(
                        "pagination@test.com",
                        "페이지테스트"
                );


        Long categoryId =
                createCategory();



        // 게시글 5개 생성
        for (int i = 1; i <= 5; i++) {

            createPost(
                    token,
                    categoryId,
                    "페이지 테스트 게시글 " + i
            );
        }



        // size=2 기준 페이지 조회
        JsonNode page0 =
                getPostsWithPage(
                        categoryId,
                        "latest",
                        "2",
                        "0"
                );


        JsonNode page1 =
                getPostsWithPage(
                        categoryId,
                        "latest",
                        "2",
                        "1"
                );


        JsonNode page2 =
                getPostsWithPage(
                        categoryId,
                        "latest",
                        "2",
                        "2"
                );



        // 페이지별 size 확인
        assertThat(page0.size())
                .isEqualTo(2);


        assertThat(page1.size())
                .isEqualTo(2);


        assertThat(page2.size())
                .isEqualTo(1);



        List<Long> postIds =
                new ArrayList<>();


        collectPostIds(
                page0,
                postIds
        );


        collectPostIds(
                page1,
                postIds
        );


        collectPostIds(
                page2,
                postIds
        );



        // 5개 모두 조회됐는지 확인
        assertThat(postIds)
                .hasSize(5);



        // 페이지 사이 중복 확인
        assertThat(postIds)
                .doesNotHaveDuplicates();
    }

    private JsonNode getPostsWithPage(
            Long categoryId,
            String sort,
            String size,
            String page
    ) throws Exception {


        var request =
                get("/api/posts")
                        .param("sort", sort)
                        .param("size", size)
                        .param("page", page);


        if (categoryId != null) {
            request.param(
                    "categoryId",
                    String.valueOf(categoryId)
            );
        }


        MvcResult result =
                mockMvc.perform(request)
                        .andExpect(status().isOk())
                        .andReturn();


        return objectMapper
                .readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .get("content");
    }

    private void collectPostIds(
            JsonNode content,
            List<Long> ids
    ) {

        content.forEach(
                post -> ids.add(
                        post.get("postId")
                                .asLong()
                )
        );
    }

    @Test
    @DisplayName("게시글 작성 후 상세 조회")
    void createAndGetPost_success() throws Exception {

        String token =
                signupAndLogin(
                        "crud@test.com",
                        "CRUD테스트"
                );

        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId,
                        "CRUD 게시글"
                );


        MvcResult result =
                mockMvc.perform(
                                get("/api/posts/" + postId)
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                        )
                        .andExpect(status().isOk())
                        .andReturn();


        JsonNode data =
                objectMapper.readTree(
                                result.getResponse()
                                        .getContentAsString()
                        )
                        .get("data");


        assertThat(
                data.get("title").asText()
        )
                .isEqualTo("CRUD 게시글");
    }

    @Test
    @DisplayName("게시글 작성자는 게시글 수정 가능")
    void updatePost_success() throws Exception {

        String token =
                signupAndLogin(
                        "update@test.com",
                        "수정테스트"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId,
                        "수정 전 제목"
                );


        mockMvc.perform(
                        patch("/api/posts/" + postId)
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                            {
                              "title": "수정 후 제목",
                              "content": "수정 내용"
                            }
                            """)
                )
                .andExpect(status().isOk());


        MvcResult result =
                mockMvc.perform(
                                get("/api/posts/" + postId)
                        )
                        .andExpect(status().isOk())
                        .andReturn();


        JsonNode post =
                objectMapper.readTree(
                                result.getResponse()
                                        .getContentAsString()
                        )
                        .get("data");


        assertThat(
                post.get("title").asText()
        )
                .isEqualTo("수정 후 제목");
    }

    @Test
    @DisplayName("게시글 삭제 후 목록에서 제외")
    void deletePost_softDelete() throws Exception {

        String token =
                signupAndLogin(
                        "delete@test.com",
                        "삭제테스트"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId,
                        "삭제될 게시글"
                );


        mockMvc.perform(
                        delete("/api/posts/" + postId)
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isNoContent());


        JsonNode content =
                getPosts(
                        categoryId,
                        "latest",
                        "10"
                );


        assertThat(content)
                .extracting(JsonNode::toString)
                .noneMatch(
                        json -> json.contains("삭제될 게시글")
                );
    }

    @Test
    @DisplayName("다른 사용자는 게시글 수정 불가")
    void updatePost_fail_when_not_owner() throws Exception {

        String ownerToken =
                signupAndLogin(
                        "owner@test.com",
                        "작성자"
                );


        String otherToken =
                signupAndLogin(
                        "other@test.com",
                        "다른사용자"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        ownerToken,
                        categoryId,
                        "작성자 게시글"
                );


        mockMvc.perform(
                        patch("/api/posts/" + postId)
                                .header(
                                        "Authorization",
                                        "Bearer " + otherToken
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                            {
                              "title": "탈취 수정",
                              "content": "수정"
                            }
                            """)
                )
                .andExpect(status().is4xxClientError());
    }
}