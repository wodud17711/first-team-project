package com.example.demo.walk.dto;

import java.util.List;

public record OptimalTimeResponse(
        String recommendedTime,
        List<String> reasons
) {
}