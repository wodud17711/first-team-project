package com.example.demo.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 회원가입 입력 검증(@Valid) 통합 테스트.
 *
 * <p>{@code SignupRequest}의 Bean Validation(@Pattern·@Size 등)은 Controller 진입 시점에만
 * 적용된다 — Service 단위 테스트로는 검증되지 않으므로 Controller 레벨에서 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSignupValidationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("영문 없는 약한 비밀번호(숫자만) → 400 INVALID_INPUT")
    void weakPassword_digitsOnly_rejected() throws Exception {
        mockMvc.perform(
                        post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"weak@example.com","password":"12345678","nickname":"테스트유저"}
                                        """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_INPUT"));
    }
}
