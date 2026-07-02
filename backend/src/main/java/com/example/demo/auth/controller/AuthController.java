package com.example.demo.auth.controller;

import com.example.demo.auth.dto.AuthResponse;
import com.example.demo.auth.dto.EmailSendCodeRequest;
import com.example.demo.auth.dto.EmailVerifyCodeRequest;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.OAuthUserInfo;
import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.service.AuthService;
import com.example.demo.auth.service.EmailVerificationService;
import com.example.demo.auth.service.OAuthService;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.user.type.AuthProvider;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;
    private final EmailVerificationService emailVerificationService;

    /**
     * 소셜 로그인 성공 후 리다이렉트할 FE 주소.
     * BE 가 RT 쿠키만 Set-Cookie 한 뒤 여기로 보내고, FE 가 /api/auth/refresh 로 AT 를 받는다.
     * (AT 를 URL 에 노출하지 않기 위함)
     */
    @Value("${app.oauth.success-redirect:http://localhost:5173/oauth/callback}")
    private String oauthSuccessRedirect;

    /**
     * RT 쿠키 Secure 플래그.
     * - 운영(HTTPS) : true (기본값)
     * - 로컬 dev(HTTP, application-local.properties): false 로 override.
     * 환경별 토글이 없으면 로컬에서 브라우저가 쿠키를 박지 않아 /api/auth/refresh 가 항상 실패.
     */
    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    /**
     * RT 쿠키 SameSite 속성.
     * - 운영: None (FE=Vercel·BE=Render 가 서로 다른 사이트 → 크로스사이트 요청에 쿠키 전송 필요).
     *   None 은 Secure 동반 필수(운영 HTTPS 라 충족).
     * - 로컬 dev: Lax (localhost 동일 사이트). application-local.properties 기본값 사용.
     * 이 토글이 없으면 운영에서 /api/auth/refresh 에 RT 쿠키가 안 실려 로그인 유지·소셜 콜백이 실패.
     */
    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    // =========================
    // 이메일 인증 (회원가입 선행)
    // =========================
    @PostMapping("/email/send-code")
    public ResponseEntity<ApiResponse<Void>> sendEmailCode(
            @Valid @RequestBody EmailSendCodeRequest request
    ) {

        emailVerificationService.sendCode(request.email());

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Verification code sent"
                )
        );
    }

    @PostMapping("/email/verify-code")
    public ResponseEntity<ApiResponse<Void>> verifyEmailCode(
            @Valid @RequestBody EmailVerifyCodeRequest request
    ) {

        emailVerificationService.verifyCode(request.email(), request.code());

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Email verified"
                )
        );
    }

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
                        request.nickname(),
                        request.guardianLevel()
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
    // 소셜 로그인 (카카오/구글/네이버)
    // =========================
    // 1) FE "소셜로 시작" → /oauth/{provider}/authorize → 제공자 인가 페이지로 302.
    // 2) 제공자가 인가코드(code)와 함께 콜백 → 토큰교환·사용자조회 → RT 쿠키 set → FE 로 302.
    //    FE 는 랜딩 후 /api/auth/refresh 로 AT 를 받아 로그인 완료(AT 를 URL 에 노출하지 않음).
    //    콜백은 브라우저 리다이렉트 흐름이라 실패 시 JSON 대신 FE 로그인 페이지로 돌려보낸다.
    @GetMapping("/oauth/kakao/authorize")
    public void kakaoAuthorize(HttpServletResponse response) throws IOException {
        response.sendRedirect(oAuthService.kakaoAuthorizeUrl());
    }

    @GetMapping("/oauth/kakao/callback")
    public void kakaoCallback(
            @RequestParam("code") String code,
            HttpServletResponse response
    ) throws IOException {

        try {
            OAuthUserInfo info = oAuthService.kakaoLogin(code);

            AuthResponse tokens =
                    authService.loginWithOAuth(AuthProvider.KAKAO, info);

            setRefreshCookie(response, tokens.refreshToken());

            response.sendRedirect(oauthSuccessRedirect);

        } catch (Exception e) {
            response.sendRedirect(oauthFailureRedirect());
        }
    }

    @GetMapping("/oauth/google/authorize")
    public void googleAuthorize(HttpServletResponse response) throws IOException {
        response.sendRedirect(oAuthService.googleAuthorizeUrl());
    }

    @GetMapping("/oauth/google/callback")
    public void googleCallback(
            @RequestParam(name = "code", required = false) String code,
            HttpServletResponse response
    ) throws IOException {

        // 사용자가 구글 동의 화면에서 취소하면 code 없이 error 파라미터로 돌아온다.
        if (code == null) {
            response.sendRedirect(oauthFailureRedirect());
            return;
        }

        try {
            OAuthUserInfo info = oAuthService.googleLogin(code);

            AuthResponse tokens =
                    authService.loginWithOAuth(AuthProvider.GOOGLE, info);

            setRefreshCookie(response, tokens.refreshToken());

            response.sendRedirect(oauthSuccessRedirect);

        } catch (Exception e) {
            response.sendRedirect(oauthFailureRedirect());
        }
    }

    // 네이버는 state 필수 — CSRF 방지용 난수를 쿠키에 심고 콜백에서 대조.
    @GetMapping("/oauth/naver/authorize")
    public void naverAuthorize(HttpServletResponse response) throws IOException {

        String state = java.util.UUID.randomUUID().toString();

        ResponseCookie stateCookie = ResponseCookie
                .from("oauthState", state)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/auth/oauth/naver")
                .maxAge(60 * 5)
                .build();
        response.addHeader("Set-Cookie", stateCookie.toString());

        response.sendRedirect(oAuthService.naverAuthorizeUrl(state));
    }

    @GetMapping("/oauth/naver/callback")
    public void naverCallback(
            @RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "state", required = false) String state,
            @CookieValue(name = "oauthState", required = false) String stateCookie,
            HttpServletResponse response
    ) throws IOException {

        if (code == null || state == null || !state.equals(stateCookie)) {
            response.sendRedirect(oauthFailureRedirect());
            return;
        }

        try {
            OAuthUserInfo info = oAuthService.naverLogin(code, state);

            AuthResponse tokens =
                    authService.loginWithOAuth(AuthProvider.NAVER, info);

            setRefreshCookie(response, tokens.refreshToken());

            response.sendRedirect(oauthSuccessRedirect);

        } catch (Exception e) {
            response.sendRedirect(oauthFailureRedirect());
        }
    }

    // 소셜 실패 랜딩: FE 로그인 페이지 (?error=social 로 안내 문구 표시).
    // success-redirect(…/oauth/callback)에서 FE origin 만 잘라 재사용 — 별도 env 불필요.
    private String oauthFailureRedirect() {
        String base = oauthSuccessRedirect.replace("/oauth/callback", "");
        return base + "/login?error=social";
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
                .sameSite(cookieSameSite)
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
                .sameSite(cookieSameSite)
                .path("/api/auth")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}