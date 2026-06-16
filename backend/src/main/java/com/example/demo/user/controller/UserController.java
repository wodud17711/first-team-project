package com.example.demo.user.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.dto.UserUpdateRequest;
import com.example.demo.user.dto.PasswordChangeRequest;
import com.example.demo.user.dto.WithdrawRequest;
import com.example.demo.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내 정보 API.
 *
 * <p>인증된 사용자만 접근 가능. {@link AuthenticationPrincipal} 로 받은
 * {@link UserDetails}(username = userId 문자열) 에서 호출자 userId 를 추출한다.
 * 패턴은 {@code DogController} 와 동일.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "User (회원)" 섹션.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** AuthController 와 동일한 환경별 토글. 운영 HTTPS=true, 로컬 dev=false. */
    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.getMyInfo(userId)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.updateMyInfo(userId, request)));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PasswordChangeRequest request
    ) {

        Long userId = resolveUserId(userDetails);

        userService.changePassword(
                userId,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WithdrawRequest request,
            HttpServletResponse response
    ) {

        Long userId = resolveUserId(userDetails);

        userService.withdraw(
                userId,
                request.password()
        );

        clearRefreshCookie(response);

        return ResponseEntity.noContent().build();
    }

    /** 탈퇴 시 RT 쿠키 즉시 만료. AuthController.clearRefreshCookie 와 동일 정책. */
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

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        try {
            return Long.parseLong(userDetails.getUsername());
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
