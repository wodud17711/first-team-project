package com.example.demo.auth;

import com.example.demo.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class refresh {

    private final AuthService authService;

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken
    ) {

        String accessToken =
                authService.refresh(refreshToken);

        return ResponseEntity.ok(
                ApiResponse.success(
                        new AuthResponse(accessToken),
                        "Token refreshed"
                )
        );
    }
}