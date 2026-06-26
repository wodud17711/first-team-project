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


import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommentE2ETest {


    @Autowired
    MockMvc mockMvc;


    @Autowired
    ObjectMapper objectMapper;


    @Autowired
    CategoryRepository categoryRepository;



    @Test
    @DisplayName("댓글 작성 조회 및 대댓글 작성")
    void createAndGetComments_success() throws Exception {


        String token =
                signupAndLogin(
                        "comment@test.com",
                        "댓글테스트"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId
                );


        // 댓글 작성
        long commentId =
                createComment(
                        token,
                        postId,
                        "첫 댓글",
                        null
                );


        // 대댓글 작성
        createComment(
                token,
                postId,
                "첫 댓글의 답글",
                commentId
        );



        MvcResult result =
                mockMvc.perform(
                                get("/api/posts/" + postId + "/comments")
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                        )
                        .andExpect(status().isOk())
                        .andReturn();



        JsonNode comments =
                objectMapper.readTree(
                                result.getResponse()
                                        .getContentAsString()
                        )
                        .get("data");



        assertThat(
                comments.size()
        )
                .isEqualTo(1);



        JsonNode parent =
                comments.get(0);



        assertThat(
                parent.get("content").asText()
        )
                .isEqualTo("첫 댓글");



        assertThat(
                parent.get("replies").size()
        )
                .isEqualTo(1);



        assertThat(
                parent.get("replies")
                        .get(0)
                        .get("content")
                        .asText()
        )
                .isEqualTo("첫 댓글의 답글");
    }





    @Test
    @DisplayName("댓글 수정 및 삭제")
    void updateAndDeleteComment_success() throws Exception {


        String token =
                signupAndLogin(
                        "comment-update@test.com",
                        "댓글수정"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId
                );


        long commentId =
                createComment(
                        token,
                        postId,
                        "수정 전 댓글",
                        null
                );



        // 수정
        mockMvc.perform(
                        patch("/api/comments/" + commentId)
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                        {
                          "content":"수정된 댓글"
                        }
                        """)
                )
                .andExpect(status().isOk());



        // 조회 확인
        MvcResult result =
                mockMvc.perform(
                                get("/api/posts/" + postId + "/comments")
                        )
                        .andExpect(status().isOk())
                        .andReturn();



        JsonNode comments =
                objectMapper.readTree(
                                result.getResponse()
                                        .getContentAsString()
                        )
                        .get("data");



        assertThat(
                comments.get(0)
                        .get("content")
                        .asText()
        )
                .isEqualTo("수정된 댓글");



        // 삭제
        mockMvc.perform(
                        delete("/api/comments/" + commentId)
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk());



        JsonNode afterDelete =
                objectMapper.readTree(
                                mockMvc.perform(
                                                get("/api/posts/" + postId + "/comments")
                                        )
                                        .andExpect(status().isOk())
                                        .andReturn()
                                        .getResponse()
                                        .getContentAsString()
                        )
                        .get("data");



        assertThat(
                afterDelete.size()
        )
                .isEqualTo(0);
    }





    private long createComment(
            String token,
            long postId,
            String content,
            Long parentCommentId
    ) throws Exception {


        String body =
                """
                {
                  "content":"%s",
                  "parentCommentId":%s
                }
                """.formatted(
                        content,
                        parentCommentId == null
                                ? "null"
                                : parentCommentId
                );


        MvcResult result =
                mockMvc.perform(
                                post("/api/posts/" + postId + "/comments")
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body)
                        )
                        .andExpect(status().isOk())
                        .andReturn();



        return objectMapper.readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .asLong();
    }




    private long createPost(
            String token,
            Long categoryId
    ) throws Exception {


        MvcResult result =
                mockMvc.perform(
                                post("/api/posts")
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                {
                                  "categoryId": %d,
                                  "title":"댓글 테스트 게시글",
                                  "content":"내용"
                                }
                                """.formatted(categoryId))
                        )
                        .andExpect(status().isOk())
                        .andReturn();


        return objectMapper.readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .get("postId")
                .asLong();
    }



    private Long createCategory() {

        Category category =
                Category.builder()
                        .name("댓글게시판_" + System.nanoTime())
                        .subTags("[]")
                        .build();


        return categoryRepository.save(category)
                .getId();
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



        return objectMapper.readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .asText();
    }

    @Test
    @DisplayName("다른 사용자가 댓글 수정 불가")
    void updateComment_otherUser_fail() throws Exception {

        String ownerToken =
                signupAndLogin(
                        "comment-owner@test.com",
                        "댓글작성자"
                );


        String otherToken =
                signupAndLogin(
                        "comment-other@test.com",
                        "다른사용자"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        ownerToken,
                        categoryId
                );


        long commentId =
                createComment(
                        ownerToken,
                        postId,
                        "작성자 댓글",
                        null
                );


        mockMvc.perform(
                        patch("/api/comments/" + commentId)
                                .header(
                                        "Authorization",
                                        "Bearer " + otherToken
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "content":"수정 시도"
                                    }
                                    """)
                )
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("댓글 삭제 시 게시글 댓글 수 감소")
    void deleteComment_decreaseCommentCount() throws Exception {

        String token =
                signupAndLogin(
                        "comment-count@test.com",
                        "댓글카운트"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId
                );


        long commentId =
                createComment(
                        token,
                        postId,
                        "댓글",
                        null
                );


        mockMvc.perform(
                        delete("/api/comments/" + commentId)
                                .header(
                                        "Authorization",
                                        "Bearer " + token
                                )
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
                post.get("commentCount")
                        .asInt()
        )
                .isEqualTo(0);
    }
}