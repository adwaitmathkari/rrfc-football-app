package com.football.api.security;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Authenticates requests that carry "Authorization: Bearer <access token>". */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER)) {
            jwtService.verify(header.substring(BEARER.length()), JwtService.TokenType.ACCESS).ifPresent(user -> {
                String role = user.role() == null ? "USER" : user.role().toUpperCase(Locale.ROOT);
                var authentication = new UsernamePasswordAuthenticationToken(
                        user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }
        chain.doFilter(request, response);
    }
}
