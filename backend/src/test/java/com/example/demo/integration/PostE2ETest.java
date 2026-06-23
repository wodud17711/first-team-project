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
}