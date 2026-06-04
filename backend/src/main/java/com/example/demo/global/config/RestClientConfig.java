package com.example.demo.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {

    // FastAPI 위험도 호출은 산책지수 응답을 막는 동기 경로라, 느리거나 다운 시 빠르게 실패시킨다.
    private static final Duration AI_TIMEOUT = Duration.ofSeconds(2);

    /**
     * FastAPI(uvicorn/h11)는 HTTP/1.1 전용이라, JDK HttpClient 기본값(HTTP/2 업그레이드 시도)으로
     * 호출하면 업그레이드 협상이 깨지면서 요청 바디가 유실된다(빈 바디 → FastAPI 422 → AI_SERVER_ERROR).
     * 따라서 RestClient 가 HTTP/1.1 로 호출하도록 명시 고정한다.
     *
     * <p>연결·응답 타임아웃 2초. 이 빈의 소비자는 {@code AiClient} 뿐이며(날씨 클라이언트는 각자
     * RestClient 를 생성), 타임아웃 초과/연결 실패는 {@code RestClientException} → AI_SERVER_ERROR 로 매핑된다.
     */
    @Bean
    public RestClient restClient() {

        HttpClient httpClient =
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(AI_TIMEOUT)
                        .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(AI_TIMEOUT);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}