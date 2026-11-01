package com.football.api.user;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.common.ApiException;

/** Admin-only endpoints (restricted to ROLE_ADMIN in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    public record TemporaryPasswordResponse(String temporaryPassword) {
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return users.findAll().stream()
                .sorted(Comparator.comparing(User::name, String.CASE_INSENSITIVE_ORDER))
                .map(UserDto::from)
                .toList();
    }

    @PostMapping("/users/{id}/reset-password")
    public TemporaryPasswordResponse resetPassword(@PathVariable String id) {
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        byte[] bytes = new byte[9];
        RANDOM.nextBytes(bytes);
        String temporaryPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        users.updatePassword(user.id(), passwordEncoder.encode(temporaryPassword), true);
        return new TemporaryPasswordResponse(temporaryPassword);
    }
}
