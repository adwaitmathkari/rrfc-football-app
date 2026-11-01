package com.football.api.auth;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.common.ApiError;
import com.football.api.config.AppProperties;
import com.football.api.security.JwtService;
import com.football.api.user.User;
import com.football.api.user.UserDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record RegisterRequest(
            @NotBlank @Size(max = 50) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotNull @Size(min = 8, max = 72) String password,
            @NotNull @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "must be a valid Indian mobile number") String phone) {
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record SessionResponse(String accessToken, UserDto user) {
    }

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final AuthService authService;
    private final JwtService jwtService;
    private final AppProperties props;

    public AuthController(AuthService authService, JwtService jwtService, AppProperties props) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.props = props;
    }

    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody RegisterRequest body) {
        return session(authService.register(body), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest body) {
        return session(authService.login(body), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String token) {
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("No session"));
        }
        return authService.refresh(token)
                .<ResponseEntity<?>>map(user -> session(user, HttpStatus.OK))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                        .body(new ApiError("Session is no longer valid")));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .build();
    }

    private ResponseEntity<SessionResponse> session(User user, HttpStatus status) {
        String refreshToken = jwtService.issue(user, JwtService.TokenType.REFRESH);
        String accessToken = jwtService.issue(user, JwtService.TokenType.ACCESS);
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(refreshToken, jwtService.refreshTtl()).toString())
                .body(new SessionResponse(accessToken, UserDto.from(user)));
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite("Strict")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(maxAge)
                .build();
    }
}
