package com.example.demo.walk;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WalkScoreService {

    private final AiClient aiClient;

    public WalkScoreResult calculateScore(
            Long dogId
    ) {
        throw new UnsupportedOperationException(
                "FastAPI 연동 예정"
        );
    }

    public OptimalTimeResponse findOptimalTime(
            Long dogId
    ) {
        return new OptimalTimeResponse(
                "06:00~08:00",
                List.of("기능 구현 예정")
        );
    }
}