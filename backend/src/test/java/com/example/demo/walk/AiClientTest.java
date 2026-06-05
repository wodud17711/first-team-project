package com.example.demo.walk;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.walk.client.AiClient;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResult;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiClientTest {

    private MockWebServer server;
    private AiClient aiClient;

    @BeforeEach
    void setUp() throws Exception {

        server = new MockWebServer();
        server.start();

        aiClient = new AiClient(restClientWith2sTimeout());

        // FastAPI 주소를 모킹 서버로 돌린다(필드 주입 @Value 우회).
        ReflectionTestUtils.setField(
                aiClient,
                "aiBaseUrl",
                "http://localhost:" + server.getPort()
        );
    }

    @AfterEach
    void tearDown() throws Exception {
        server.shutdown();
    }

    @Test
    @DisplayName("FastAPI 200 응답을 WalkScoreResult 로 매핑한다 (top_reasons → topReasons)")
    void calculate_score_success() {

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""
                        {
                          "score": 5,
                          "level": "위험",
                          "reasons": ["지면이 뜨겁습니다", "체감온도가 높습니다"],
                          "top_reasons": ["지면이 뜨겁습니다"]
                        }
                        """));

        WalkScoreResult result = aiClient.calculateScore(sampleRequest());

        assertThat(result.score()).isEqualTo(5);
        assertThat(result.level()).isEqualTo("위험");
        assertThat(result.reasons()).hasSize(2);
        assertThat(result.topReasons()).containsExactly("지면이 뜨겁습니다");
    }

    @Test
    @DisplayName("FastAPI 5xx 응답이면 AI_SERVER_ERROR")
    void calculate_score_server_error() {

        server.enqueue(new MockResponse().setResponseCode(500));

        assertThatThrownBy(() -> aiClient.calculateScore(sampleRequest()))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(
                        ((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.AI_SERVER_ERROR));
    }

    @Test
    @DisplayName("FastAPI 다운(연결 불가) 시 AI_SERVER_ERROR")
    void calculate_score_connection_refused() throws Exception {

        // 서버를 내려 포트를 닫는다 → 연결 거부.
        server.shutdown();

        assertThatThrownBy(() -> aiClient.calculateScore(sampleRequest()))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(
                        ((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.AI_SERVER_ERROR));
    }

    @Test
    @DisplayName("응답이 타임아웃(2초 초과)되면 AI_SERVER_ERROR")
    void calculate_score_timeout() {

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("{\"score\":100,\"level\":\"안전\",\"reasons\":[],\"top_reasons\":[]}")
                .setBodyDelay(3, TimeUnit.SECONDS));

        assertThatThrownBy(() -> aiClient.calculateScore(sampleRequest()))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(
                        ((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.AI_SERVER_ERROR));
    }

    // 운영(RestClientConfig)과 동일한 HTTP/1.1 + 2초 타임아웃 클라이언트.
    private static RestClient restClientWith2sTimeout() {

        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(2))
                .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(2));

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    private static WalkScoreRequest sampleRequest() {

        return new WalkScoreRequest(
                new WalkScoreRequest.DogInfo(
                        "말티즈", "소형", "장모",
                        1, 3.5, false, 2, 3),
                new WalkScoreRequest.WeatherInfo(
                        32.0, 35.0, 75, 2.0,
                        55.0, 50, 30, "없음", 0)
        );
    }
}
