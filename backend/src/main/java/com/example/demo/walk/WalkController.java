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

        WalkScoreRequest request =
                new WalkScoreRequest(dogId);

        WalkScoreResult result =
                walkScoreService.calculateScore(request);

        WalkScoreResponse response =
                WalkScoreResponse.from(result);

        return ResponseEntity.ok(response);
    }
}