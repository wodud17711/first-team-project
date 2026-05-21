package com.example.demo.auth;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.response.ApiResponse;
import com.example.demo.auth.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class signup {

    private final AuthService authService;

    @PostMapping("/api/auth/signup")
    public ResponseEntity<?> signup(
            @RequestBody SignupRequest request,
            HttpServletResponse response
    ) {

        LoginResult result =
                authService.signup(
                        request.email(),
                        request.password()
                );

        setRefreshCookie(response, result.refreshToken());

        return ResponseEntity.ok(
                ApiResponse.success(
                        new AuthResponse(result.accessToken()),
                        "Signup successful"
                )
        );
    }

    private void setRefreshCookie(
            HttpServletResponse response,
            String refreshToken
    ) {

        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(60 * 60 * 24 * 14)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}