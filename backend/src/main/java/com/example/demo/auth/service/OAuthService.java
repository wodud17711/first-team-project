package com.example.demo.auth.service;

import com.example.demo.auth.dto.OAuthUserInfo;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * 소셜 로그인 OAuth 처리 (카카오·구글·네이버).
 *
 * <p>플로우: authorize URL 생성 → (제공자 콜백 code) → 토큰 교환 → 사용자 정보 조회 → {@link OAuthUserInfo}.
 * 우리 JWT/RT 발급은 {@link AuthService#loginWithOAuth} 가 담당(기존 인증 재활용).
 */
@Service
public class OAuthService {

    // 소셜 제공자는 표준 HTTPS(HTTP/1.1·2 무관) — AiClient 전용 HTTP/1.1 고정 RestClient 와 분리해 자체 생성.
    private final RestClient restClient = RestClient.create();

    @Value("${kakao.client-id}")
    private String kakaoClientId;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    @Value("${google.redirect-uri:}")
    private String googleRedirectUri;

    @Value("${naver.client-id:}")
    private String naverClientId;

    @Value("${naver.client-secret:}")
    private String naverClientSecret;

    @Value("${naver.redirect-uri:}")
    private String naverRedirectUri;

    // =========================
    // 카카오
    // =========================

    /** 카카오 인가 페이지 URL (BE 가 302 로 리다이렉트). */
    public String kakaoAuthorizeUrl() {
        return UriComponentsBuilder
                .fromUriString("https://kauth.kakao.com/oauth/authorize")
                .queryParam("client_id", kakaoClientId)
                .queryParam("redirect_uri", kakaoRedirectUri)
                .queryParam("response_type", "code")
                .build()
                .toUriString();
    }

    /** 카카오 인가코드 → 사용자 정보. */
    public OAuthUserInfo kakaoLogin(String code) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", kakaoClientId);
        if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
            form.add("client_secret", kakaoClientSecret);
        }
        form.add("redirect_uri", kakaoRedirectUri);
        form.add("code", code);

        String accessToken = requestToken("https://kauth.kakao.com/oauth/token", form);
        return requestKakaoUser(accessToken);
    }

    private OAuthUserInfo requestKakaoUser(String accessToken) {

        Map<?, ?> res = requestUser("https://kapi.kakao.com/v2/user/me", accessToken);

        if (res.get("id") == null) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }

        String providerId = res.get("id").toString();
        String nickname = null;
        String profileImage = null;

        // kakao_account.profile.{nickname, profile_image_url} (비즈앱 아니면 이메일은 없음)
        if (res.get("kakao_account") instanceof Map<?, ?> account
                && account.get("profile") instanceof Map<?, ?> profile) {
            if (profile.get("nickname") != null) {
                nickname = profile.get("nickname").toString();
            }
            if (profile.get("profile_image_url") != null) {
                profileImage = profile.get("profile_image_url").toString();
            }
        }

        return new OAuthUserInfo(providerId, nickname, profileImage, null);
    }

    // =========================
    // 구글
    // =========================

    /** 구글 인가 페이지 URL. scope=openid email profile (이메일은 기존 계정 자동 연동에 사용). */
    public String googleAuthorizeUrl() {
        return UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", googleRedirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .build()
                .toUriString();
    }

    /** 구글 인가코드 → 사용자 정보. */
    public OAuthUserInfo googleLogin(String code) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", googleClientId);
        form.add("client_secret", googleClientSecret);
        form.add("redirect_uri", googleRedirectUri);
        form.add("code", code);

        String accessToken = requestToken("https://oauth2.googleapis.com/token", form);
        return requestGoogleUser(accessToken);
    }

    private OAuthUserInfo requestGoogleUser(String accessToken) {

        Map<?, ?> res = requestUser("https://www.googleapis.com/oauth2/v3/userinfo", accessToken);

        if (res.get("sub") == null) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }

        String providerId = res.get("sub").toString();
        String nickname = res.get("name") != null ? res.get("name").toString() : null;
        String profileImage = res.get("picture") != null ? res.get("picture").toString() : null;

        // 이메일은 구글이 검증(email_verified=true)한 경우만 신뢰 — 기존 계정 연동 판단에 쓰이기 때문.
        String email = null;
        if (Boolean.TRUE.equals(res.get("email_verified")) && res.get("email") != null) {
            email = res.get("email").toString();
        }

        return new OAuthUserInfo(providerId, nickname, profileImage, email);
    }

    // =========================
    // 네이버
    // =========================

    /** 네이버 인가 페이지 URL. state 는 CSRF 방지용 — 컨트롤러가 쿠키로 심고 콜백에서 대조한다. */
    public String naverAuthorizeUrl(String state) {
        return UriComponentsBuilder
                .fromUriString("https://nid.naver.com/oauth2.0/authorize")
                .queryParam("client_id", naverClientId)
                .queryParam("redirect_uri", naverRedirectUri)
                .queryParam("response_type", "code")
                .queryParam("state", state)
                .build()
                .toUriString();
    }

    /** 네이버 인가코드 → 사용자 정보. */
    public OAuthUserInfo naverLogin(String code, String state) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", naverClientId);
        form.add("client_secret", naverClientSecret);
        form.add("code", code);
        form.add("state", state);

        String accessToken = requestToken("https://nid.naver.com/oauth2.0/token", form);
        return requestNaverUser(accessToken);
    }

    private OAuthUserInfo requestNaverUser(String accessToken) {

        Map<?, ?> res = requestUser("https://openapi.naver.com/v1/nid/me", accessToken);

        // 네이버는 {resultcode, message, response:{...}} 래핑 — resultcode "00" = 성공.
        if (!(res.get("response") instanceof Map<?, ?> profile) || profile.get("id") == null) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }

        String providerId = profile.get("id").toString();
        String nickname = profile.get("nickname") != null ? profile.get("nickname").toString() : null;
        String profileImage = profile.get("profile_image") != null ? profile.get("profile_image").toString() : null;
        // 네이버 이메일은 네이버가 본인확인한 연락처 이메일 → 연동 판단에 사용 가능.
        String email = profile.get("email") != null ? profile.get("email").toString() : null;

        return new OAuthUserInfo(providerId, nickname, profileImage, email);
    }

    // =========================
    // 공통 HTTP
    // =========================

    /** 토큰 엔드포인트 호출 → access_token 추출. 제공자 오류는 전부 OAUTH_ERROR 로 수렴. */
    private String requestToken(String uri, MultiValueMap<String, String> form) {

        try {
            Map<?, ?> res = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            Object accessToken = res != null ? res.get("access_token") : null;
            if (accessToken == null) {
                throw new BusinessException(ErrorCode.OAUTH_ERROR);
            }
            return accessToken.toString();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }
    }

    /** 사용자 정보 엔드포인트 호출 (Bearer). */
    private Map<?, ?> requestUser(String uri, String accessToken) {

        try {
            Map<?, ?> res = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (res == null) {
                throw new BusinessException(ErrorCode.OAUTH_ERROR);
            }
            return res;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }
    }
}
