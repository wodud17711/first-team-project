package com.example.demo.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    // Access Token 유효시간: 15분
    private static final long ACCESS_TOKEN_EXPIRE =
            1000L * 60 * 15;

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
                .signWith(
                        SignatureAlgorithm.HS256,
                        secretKey
                )
                .compact();
    }

    // =========================
    // Token에서 userId 추출
    // =========================
    public Long getUserId(String token) {

        Claims claims =
                Jwts.parser()
                        .setSigningKey(secretKey)
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

            Jwts.parser()
                    .setSigningKey(secretKey)
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }
}