package com.example.demo.walk;

import java.util.List;

public record WalkScoreResponse(

        int score,
        String level,
        List<String> reasons,
        List<String> preparations
) {

    public static WalkScoreResponse from(
            WalkScoreResult result
    ) {

        return new WalkScoreResponse(
                result.score(),
                result.level().name(),
                result.reasons(),
                result.preparations()
        );
    }
}