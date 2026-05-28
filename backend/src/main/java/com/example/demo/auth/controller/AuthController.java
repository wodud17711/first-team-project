package com.example.demo.auth.controller;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.service.AuthService;
import com.example.demo.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * RT 쿠키 Secure 플래그.
     * - 운영(HTTPS) : true (기본값)
     * - 로컬 dev(HTTP, application-local.properties): false 로 override.
     * 환경별 토글이 없으면 로컬에서 브라우저가 쿠키를 박지 않아 /api/auth/refresh 가 항상 실패.
     */
    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    // =========================
    // 회원가입
    // =========================
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<String>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response
    ) {

        AuthResponse result =
                authService.signup(
                        request.email(),
                        request.password(),
                        request.nickname()
                );

        setRefreshCookie(response, result.refreshToken());

        return ResponseEntity.ok(
                ApiResponse.success(
                        result.accessToken(),
                        "Signup successful"
                )
        );
    }

    // =========================
    // 로그인
    // =========================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {

        AuthResponse result =
                authService.login(
                        request.email(),
                        request.password()
                );

        setRefreshCookie(response, result.refreshToken());

        return ResponseEntity.ok(
                ApiResponse.success(
                        result.accessToken(),
                        "Login successful"
                )
        );
    }

    // =========================
    // 토큰 재발급
    // =========================
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<String>> refresh(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken
    ) {

        String newAccessToken =
                authService.refresh(refreshToken);

        return ResponseEntity.ok(
                ApiResponse.success(
                        newAccessToken,
                        "Token refreshed"
                )
        );
    }

    // =========================
    // 로그아웃
    // =========================
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken,
            HttpServletResponse response
    ) {

        authService.logout(refreshToken);

        clearRefreshCookie(response);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Logout successful"
                )
        );
    }

    // =========================
    // Cookie 설정
    // =========================
    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {

        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(60 * 60 * 24 * 14)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {

        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}