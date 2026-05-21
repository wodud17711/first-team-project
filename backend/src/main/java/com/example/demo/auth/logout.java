package com.example.demo.auth;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class logout {

    private final AuthService authService;

    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken,
            HttpServletResponse response
    ) {

        authService.logout(refreshToken);

        clearCookie(response);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Logout successful"
                )
        );
    }

    private void clearCookie(HttpServletResponse response) {

        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}