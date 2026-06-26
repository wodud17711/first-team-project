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
 * 소셜 로그인 OAuth 처리 (현재 카카오, 구글은 동일 패턴으로 확장).
 *
 * <p>플로우: authorize URL 생성 → (카카오 콜백 code) → 토큰 교환 → 사용자 정보 조회 → {@link OAuthUserInfo}.
 * 우리 JWT/RT 발급은 {@link AuthService#loginWithOAuth} 가 담당(기존 인증 재활용).
 */
@Service
public class OAuthService {

    // 카카오는 표준 HTTPS(HTTP/1.1·2 무관) — AiClient 전용 HTTP/1.1 고정 RestClient 와 분리해 자체 생성.
    private final RestClient restClient = RestClient.create();

    @Value("${kakao.client-id}")
    private String kakaoClientId;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

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
        String accessToken = requestKakaoToken(code);
        return requestKakaoUser(accessToken);
    }

    private String requestKakaoToken(String code) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", kakaoClientId);
        if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
            form.add("client_secret", kakaoClientSecret);
        }
        form.add("redirect_uri", kakaoRedirectUri);
        form.add("code", code);

        try {
            Map<?, ?> res = restClient.post()
                    .uri("https://kauth.kakao.com/oauth/token")
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

    private OAuthUserInfo requestKakaoUser(String accessToken) {

        try {
            Map<?, ?> res = restClient.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (res == null || res.get("id") == null) {
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

            return new OAuthUserInfo(providerId, nickname, profileImage);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OAUTH_ERROR);
        }
    }
}
