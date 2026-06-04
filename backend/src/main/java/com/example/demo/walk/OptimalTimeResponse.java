package com.example.demo.walk;

import java.util.List;

public record OptimalTimeResponse(
        String recommendedTime,
        List<String> reasons
) {
}