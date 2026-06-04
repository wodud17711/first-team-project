package com.example.demo.walk.client;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.walk.dto.WalkScoreRequest;
import com.example.demo.walk.dto.WalkScoreResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@RequiredArgsConstructor
public class AiClient {

    private final RestClient restClient;

    @Value("${ai.base-url}")
    private String aiBaseUrl;

    public WalkScoreResult calculateScore(
            WalkScoreRequest request
    ) {

        try {

            return restClient.post()
                    .uri(aiBaseUrl + "/score")
                    .body(request)
                    .retrieve()
                    .body(WalkScoreResult.class);

        } catch (RestClientException e) {

            throw new BusinessException(
                    ErrorCode.AI_SERVER_ERROR
            );
        }
    }
}