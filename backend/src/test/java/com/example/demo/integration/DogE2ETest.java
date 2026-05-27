package com.example.demo.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Week 2 e2e 통합 시나리오: 회원가입 → 로그인 → 반려견 등록 → 목록.
 *
 * <p>H2 인메모리 DB(MODE=MySQL) 로 격리. 시드는 비활성, 견종(breedId=null) 없이 테스트.
 * 인증 통합(JWT)부터 dog CRUD 까지 한 번에 검증한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DogE2ETest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    @DisplayName("회원가입 → 로그인 → 반려견 등록 → 목록 4단계 시나리오")
    void fullFlow_signupLoginRegisterList() throws Exception {
        String email = "e2e@example.com";
        String password = "password1234";

        // ===== 1. 회원가입 =====
        MvcResult signupResult = mockMvc.perform(
                        post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {"email":"%s","password":"%s","nickname":"%s"}
                                """.formatted(email, password, "테스트유저"))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isString())
                .andReturn();

        String signupAccessToken = readData(signupResult);
        assertThat(signupAccessToken).isNotBlank();

        // ===== 2. 로그인 (재인증) — accessToken 갱신 =====
        MvcResult loginResult = mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"%s","password":"%s"}
                                        """.formatted(email, password))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String accessToken = readData(loginResult);
        assertThat(accessToken).isNotBlank();

        // ===== 3. 반려견 등록 (Bearer 토큰) — breedId 없이 (Mix) =====
        mockMvc.perform(
                        post("/api/dogs")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "name": "초코",
                                          "gender": "F",
                                          "isNeutered": true,
                                          "activityLevel": "중"
                                        }
                                        """)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("초코"))
                .andExpect(jsonPath("$.data.gender").value("F"))
                .andExpect(jsonPath("$.data.isNeutered").value(true))
                .andExpect(jsonPath("$.data.activityLevel").value("중"));

        // ===== 4. 내 반려견 목록 → 방금 등록한 개체가 보여야 함 =====
        mockMvc.perform(
                        get("/api/dogs")
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("초코"));
    }

    @Test
    @DisplayName("토큰 없이 /api/dogs 호출 → 401")
    void unauthenticated_blocked() throws Exception {
        mockMvc.perform(get("/api/dogs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("토큰 없이 /api/breeds 호출 → 200 (permitAll)")
    void breedsEndpoint_isPublic() throws Exception {
        mockMvc.perform(get("/api/breeds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private String readData(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("data").asText();
    }
}
