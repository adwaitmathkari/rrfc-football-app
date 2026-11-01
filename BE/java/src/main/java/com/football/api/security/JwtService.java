package com.football.api.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import com.football.api.config.AppProperties;
import com.football.api.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

/**
 * Issues and verifies HS256 JWTs. Uses the same secrets and claims as the Node backend,
 * so a token from either backend is accepted by the other.
 */
@Service
public class JwtService {

    public enum TokenType {
        ACCESS("access"), REFRESH("refresh");

        private final String claim;

        TokenType(String claim) {
            this.claim = claim;
        }
    }

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtService(AppProperties props) {
        var jwt = props.jwt();
        this.accessKey = hmacKey(jwt.accessSecret());
        this.refreshKey = hmacKey(jwt.refreshSecret());
        this.accessTtl = Duration.ofMinutes(jwt.accessTtlMinutes());
        this.refreshTtl = Duration.ofDays(jwt.refreshTtlDays());
    }

    private static SecretKey hmacKey(String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secrets must be at least 32 characters (see BE/.env)");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public Duration refreshTtl() {
        return refreshTtl;
    }

    public String issue(User user, TokenType type) {
        Instant now = Instant.now();
        Duration ttl = type == TokenType.ACCESS ? accessTtl : refreshTtl;
        return Jwts.builder()
                .subject(user.id())
                .claim("role", user.role())
                .claim("typ", type.claim)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(keyFor(type), Jwts.SIG.HS256)
                .compact();
    }

    public Optional<AuthUser> verify(String token, TokenType type) {
        try {
            Claims claims = Jwts.parser().verifyWith(keyFor(type)).build().parseSignedClaims(token).getPayload();
            if (!type.claim.equals(claims.get("typ", String.class)) || claims.getSubject() == null) {
                return Optional.empty();
            }
            return Optional.of(new AuthUser(claims.getSubject(), claims.get("role", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private SecretKey keyFor(TokenType type) {
        return type == TokenType.ACCESS ? accessKey : refreshKey;
    }
}
