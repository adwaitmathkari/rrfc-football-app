package com.football.api.security;

/** The logged-in user, taken from the access token. Available in controllers via @AuthenticationPrincipal. */
public record AuthUser(String userId, String role) {
}
