package com.example.demo.walk.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WalkScoreResult(

        int score,
        String level,
        List<String> reasons,

        @JsonProperty("top_reasons")
        List<String> topReasons
) {
}