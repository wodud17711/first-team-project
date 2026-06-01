package com.example.demo.walk;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/walk")
@RequiredArgsConstructor
public class WalkController {

    private final WalkScoreService walkScoreService;

    @GetMapping("/score")
    public ResponseEntity<WalkScoreResponse> getWalkScore(
            @RequestParam Long dogId
    ) {

        WalkScoreResult result =
                walkScoreService.calculateScore(dogId);

        return ResponseEntity.ok(
                WalkScoreResponse.from(result)
        );
    }
}