package com.example.demo.walk.dto;

import java.util.List;

public record WalkScoreResponse(

        int score,
        String level,
        List<String> reasons,
        List<String> reasonCodes,
        List<String> topReasons,
        List<String> topReasonCodes
) {

    public static WalkScoreResponse from(
            WalkScoreResult result
    ) {

        return new WalkScoreResponse(
                result.score(),
                result.level(),
                result.reasons(),
                result.reasonCodes(),
                result.topReasons(),
                result.topReasonCodes()
        );
    }
}