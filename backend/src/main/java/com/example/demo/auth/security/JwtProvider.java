package com.example.demo.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collections;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    // Access Token 유효시간: 15분
    private static final long ACCESS_TOKEN_EXPIRE =
            1000L * 60 * 15;

    /**
     * HMAC-SHA256 서명 키. HS256 은 32바이트(256bit) 이상 필요.
     * 부팅 시점에 검증하여, 키가 짧으면 즉시 WeakKeyException → 부팅 실패로 운영 사고 예방.
     */
    private Key key;

    @PostConstruct
    void init() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        // Keys.hmacShaKeyFor 가 32바이트 미만 시 WeakKeyException 던짐 → 부팅 fail-fast.
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // =========================
    // Access Token 생성
    // =========================
    public String generateAccessToken(Long userId) {

        Date now = new Date();

        Date expiry =
                new Date(
                        now.getTime()
                                + ACCESS_TOKEN_EXPIRE
                );

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================
    // Token에서 userId 추출
    // =========================
    public Long getUserId(String token) {

        Claims claims =
                Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

        return Long.parseLong(
                claims.getSubject()
        );
    }

    // =========================
    // Token 유효성 검증
    // =========================
    public boolean validateToken(String token) {

        try {

            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    public String resolveToken(HttpServletRequest request) {

        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null &&
                bearerToken.startsWith("Bearer ")) {

            return bearerToken.substring(7);
        }

        return null;
    }

    public Authentication getAuthentication(String token) {

        Long userId = getUserId(token);

        CustomUserPrincipal principal =
                new CustomUserPrincipal(userId);

        return new UsernamePasswordAuthenticationToken(
                principal,
                "",
                principal.getAuthorities()
        );
    }
}
