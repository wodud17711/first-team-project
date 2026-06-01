package com.example.demo.walk;

import java.util.List;

public record WalkScoreResult(

        int score,
        RiskLevel level,
        List<String> reasons,
        List<String> preparations
) {
}