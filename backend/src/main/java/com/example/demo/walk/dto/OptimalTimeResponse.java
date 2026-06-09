package com.example.demo.walk.dto;

import java.util.List;

public record OptimalTimeResponse(
        List<SlotResult> slots,
        List<SlotResult> best
) {}