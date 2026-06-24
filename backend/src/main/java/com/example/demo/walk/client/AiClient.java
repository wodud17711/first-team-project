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

    /**
     * FastAPI /health 핑(워밍업 용도). 점수 경로와 달리 실패해도 예외를 던지지 않고
     * 성공 여부만 boolean 으로 반환한다 — 콜드스타트 중/미기동이면 false.
     * (Render 무료 인스턴스 슬립 깨우기 트리거. 자세한 한계는 {@code AiWarmupScheduler} 참고)
     */
    public boolean pingHealth() {

        try {

            restClient.get()
                    .uri(aiBaseUrl + "/health")
                    .retrieve()
                    .toBodilessEntity();

            return true;

        } catch (RestClientException e) {

            return false;
        }
    }
}