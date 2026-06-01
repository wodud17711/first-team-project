package com.example.demo.walk;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class AiClient {

    private final RestClient restClient;

    @Value("${ai.base-url}")
    private String aiBaseUrl;

    public WalkScoreResult calculateScore(
            WalkScoreRequest request
    ) {

        return restClient.post()
                .uri(aiBaseUrl + "/score")
                .body(request)
                .retrieve()
                .body(WalkScoreResult.class);
    }
}