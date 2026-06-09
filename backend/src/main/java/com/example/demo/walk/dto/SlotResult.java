package com.example.demo.walk.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SlotResult(
        LocalDateTime time,
        int score,
        String level,
        List<String> topReasonCodes
) {}
