package com.example.demo.walk;

import java.util.List;

public record WalkScoreResult(

        int score,
        String level,
        List<String> reasons,
        List<String> topReasons
) {
}