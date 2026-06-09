package com.example.demo.integration;

import com.example.demo.dog.entity.Dog;
import com.example.demo.dog.repository.DogRepository;
import com.example.demo.walk.domain.WalkScore;
import com.example.demo.walk.repository.WalkScoreRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Week 4 e2e 시나리오 3: 산책 시작 → 종료 → 이력 조회.
 *
 * <p>H2 인메모리(MODE=MySQL) 격리. 명세({@code docs/06-api-spec.md} Walk 섹션) 기준으로 검증한다.
 * 정상 흐름의 duration/distance 반영, 타인 dog 403, 미종료 중복 시작 409 를 다룬다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WalkE2ETest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    WalkScoreRepository walkScoreRepository;

    @Autowired
    DogRepository dogRepository;

    @Test
    @DisplayName("산책 시작 → 종료 → 이력: duration·distance 정상 반영")
    void fullFlow_startEndHistory() throws Exception {
        String token = signupAndLogin("walker@example.com", "워커");
        long dogId = registerDog(token, "초코");

        // ===== 시작 =====
        MvcResult startResult = mockMvc.perform(
                        post("/api/walks/start")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"dogId": %d}
                                        """.formatted(dogId))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dogId").value((int) dogId))
                .andExpect(jsonPath("$.data.inProgress").value(true))
                .andExpect(jsonPath("$.data.endTime").doesNotExist())
                .andReturn();

        long walkId = readLong(startResult, "walkId");

        // ===== 종료 (거리·메모 수동 입력) =====
        mockMvc.perform(
                        post("/api/walks/" + walkId + "/end")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"distanceKm": 2.50, "memo": "한강 산책"}
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.inProgress").value(false))
                .andExpect(jsonPath("$.data.endTime").exists())
                .andExpect(jsonPath("$.data.durationMinutes").exists())
                .andExpect(jsonPath("$.data.distanceKm").value(2.50))
                .andExpect(jsonPath("$.data.memo").value("한강 산책"));

        // ===== 이력 → 방금 기록이 보여야 함 =====
        mockMvc.perform(
                        get("/api/walks/history")
                                .header("Authorization", "Bearer " + token)
                                .param("dogId", String.valueOf(dogId))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].walkId").value((int) walkId))
                .andExpect(jsonPath("$.data[0].distanceKm").value(2.50))
                .andExpect(jsonPath("$.data[0].inProgress").value(false));
    }

    @Test
    @DisplayName("타인 dogId 로 산책 시작 → 403")
    void start_othersDog_forbidden() throws Exception {
        String ownerToken = signupAndLogin("owner@example.com", "주인");
        long dogId = registerDog(ownerToken, "보리");

        String otherToken = signupAndLogin("other@example.com", "타인");

        mockMvc.perform(
                        post("/api/walks/start")
                                .header("Authorization", "Bearer " + otherToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"dogId": %d}
                                        """.formatted(dogId))
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("미종료 산책이 있는데 다시 시작 → 409")
    void start_whileInProgress_conflict() throws Exception {
        String token = signupAndLogin("dup@example.com", "중복");
        long dogId = registerDog(token, "두부");

        String body = """
                {"dogId": %d}
                """.formatted(dogId);

        mockMvc.perform(
                        post("/api/walks/start")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body)
                )
                .andExpect(status().isCreated());

        mockMvc.perform(
                        post("/api/walks/start")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("WALK_ALREADY_IN_PROGRESS"));
    }

    @Test
    @DisplayName("산책 시작 시 직전 위험도 점수(30분 이내, 미연결)가 그 산책에 귀속된다 [A-2]")
    void start_linksRecentWalkScore() throws Exception {
        String token = signupAndLogin("scorelink@example.com", "점수");
        long dogId = registerDog(token, "산이");

        // 산책 직전 조회만 한 점수: walk_id NULL, measured_at = now (30분 윈도우 내)
        Dog dog = dogRepository.findById(dogId).orElseThrow();
        WalkScore seeded = walkScoreRepository.save(
                WalkScore.create(dog, null, 70, "주의", "기온 높음"));
        assertThat(seeded.getWalkId()).isNull();

        MvcResult startResult = mockMvc.perform(
                        post("/api/walks/start")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"dogId": %d}
                                        """.formatted(dogId))
                )
                .andExpect(status().isCreated())
                .andReturn();
        long walkId = readLong(startResult, "walkId");

        // 산책 1건에 walk_score 1건 연결 조회됨 (완료 기준)
        WalkScore linked = walkScoreRepository.findById(seeded.getId()).orElseThrow();
        assertThat(linked.getWalkId()).isEqualTo(walkId);
    }

    // ===== helpers =====

    private String signupAndLogin(String email, String nickname) throws Exception {
        mockMvc.perform(
                        post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"%s","password":"password1234","nickname":"%s"}
                                        """.formatted(email, nickname))
                )
                .andExpect(status().isOk());

        MvcResult loginResult = mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"%s","password":"password1234"}
                                        """.formatted(email))
                )
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").asText();
    }

    private long registerDog(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/api/dogs")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"name":"%s","activityLevel":"중"}
                                        """.formatted(name))
                )
                .andExpect(status().isCreated())
                .andReturn();

        return readLong(result, "dogId");
    }

    private long readLong(MvcResult result, String field) throws Exception {
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return data.get(field).asLong();
    }
}
