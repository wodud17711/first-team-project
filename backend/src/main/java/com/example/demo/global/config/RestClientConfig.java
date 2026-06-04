package com.example.demo.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Configuration
public class RestClientConfig {

    /**
     * FastAPI(uvicorn/h11)는 HTTP/1.1 전용이라, JDK HttpClient 기본값(HTTP/2 업그레이드 시도)으로
     * 호출하면 업그레이드 협상이 깨지면서 요청 바디가 유실된다(빈 바디 → FastAPI 422 → AI_SERVER_ERROR).
     * 따라서 RestClient 가 HTTP/1.1 로 호출하도록 명시 고정한다.
     */
    @Bean
    public RestClient restClient() {

        HttpClient httpClient =
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .build();

        return RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
    }
}