package com.example.demo.walk.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WalkScoreResult(

        int score,
        String level,
        List<String> reasons,

        @JsonProperty("reason_codes")
        List<String> reasonCodes,

        @JsonProperty("top_reasons")
        List<String> topReasons,

        @JsonProperty("top_reason_codes")
        List<String> topReasonCodes
) {
}