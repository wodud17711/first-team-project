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
class LikeE2ETest {


    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CategoryRepository categoryRepository;


    @Test
    @DisplayName("게시글 좋아요 추가 및 취소 toggle")
    void toggleLike_success() throws Exception {


        String token =
                signupAndLogin(
                        "like@test.com",
                        "좋아요테스트"
                );


        Long categoryId =
                createCategory();


        long postId =
                createPost(
                        token,
                        categoryId
                );


        // 좋아요 추가
        JsonNode first =
                toggleLike(
                        token,
                        postId
                );


        assertThat(
                first.get("liked").asBoolean()
        )
                .isTrue();


        assertThat(
                first.get("likeCount").asInt()
        )
                .isEqualTo(1);



        // 좋아요 취소
        JsonNode second =
                toggleLike(
                        token,
                        postId
                );


        assertThat(
                second.get("liked").asBoolean()
        )
                .isFalse();


        assertThat(
                second.get("likeCount").asInt()
        )
                .isEqualTo(0);
    }



    private JsonNode toggleLike(
            String token,
            long postId
    ) throws Exception {


        MvcResult result =
                mockMvc.perform(
                                post("/api/posts/" + postId + "/likes")
                                        .header(
                                                "Authorization",
                                                "Bearer " + token
                                        )
                        )
                        .andExpect(status().isOk())
                        .andReturn();


        return objectMapper
                .readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data");
    }



    private Long createCategory() {

        Category category =
                Category.builder()
                        .name("좋아요게시판_" + System.nanoTime())
                        .subTags("[]")
                        .build();


        return categoryRepository.save(category)
                .getId();
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
                                      "title": "좋아요 테스트",
                                      "content": "내용"
                                    }
                                    """.formatted(categoryId))
                        )
                        .andExpect(status().isOk())
                        .andReturn();


        return objectMapper
                .readTree(
                        result.getResponse()
                                .getContentAsString()
                )
                .get("data")
                .get("postId")
                .asLong();
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
}