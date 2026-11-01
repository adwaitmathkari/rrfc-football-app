package com.football.api.security;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.web.filter.OncePerRequestFilter;

import com.football.api.common.ApiError;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Simple in-memory, per-IP limit on login/register attempts (mirrors express-rate-limit in the Node backend). */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int LIMIT = 20;
    private static final long WINDOW_MS = 15 * 60 * 1000;
    private static final Set<String> LIMITED_PATHS = Set.of("/api/auth/login", "/api/auth/register");

    private record Window(long startedAt, AtomicInteger count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("POST".equals(request.getMethod()) && LIMITED_PATHS.contains(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().startedAt() > WINDOW_MS);
        }
        Window window = windows.compute(request.getRemoteAddr(), (ip, existing) ->
                existing == null || now - existing.startedAt() > WINDOW_MS ? new Window(now, new AtomicInteger()) : existing);

        if (window.count().incrementAndGet() > LIMIT) {
            ApiError.write(response, 429, "Too many attempts, please try again later");
            return;
        }
        chain.doFilter(request, response);
    }
}
