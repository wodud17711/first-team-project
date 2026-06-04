package com.example.demo.walk;

import java.util.List;

public record WalkScoreResponse(

        int score,
        String level,
        List<String> reasons,
        List<String> topReasons
) {

    public static WalkScoreResponse from(
            WalkScoreResult result
    ) {

        return new WalkScoreResponse(
                result.score(),
                result.level(),
                result.reasons(),
                result.topReasons()
        );
    }
}