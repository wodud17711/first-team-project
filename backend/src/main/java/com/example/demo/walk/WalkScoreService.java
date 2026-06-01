package com.example.demo.walk;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WalkScoreService {

    private final AiClient aiClient;

    public WalkScoreResult calculateScore(
            WalkScoreRequest request
    ) {
        return aiClient.calculateScore(request);
    }
}