package com.football.api.auth;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.football.api.common.ApiException;
import com.football.api.common.Times;
import com.football.api.security.AuthUser;
import com.football.api.security.JwtService;
import com.football.api.user.User;
import com.football.api.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    // Compared against when the email is unknown so response time doesn't reveal which emails exist
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyHash = passwordEncoder.encode("timing-equalizer");
    }

    public User register(AuthController.RegisterRequest req) {
        String email = normalizeEmail(req.email());
        // Stored as +91XXXXXXXXXX regardless of whether the user typed the prefix
        String phone = "+91" + req.phone().substring(req.phone().length() - 10);

        if (users.findByEmail(email).isPresent()) {
            throw ApiException.conflict("Email is already registered");
        }
        if (users.phoneExists(phone)) {
            throw ApiException.conflict("Phone number is already registered");
        }

        String now = Times.nowIso();
        User user = new User(UUID.randomUUID().toString(), req.name().trim(), email,
                passwordEncoder.encode(req.password()), phone, User.ROLE_USER, User.STATUS_ACTIVE, false,
                0, 0, 0, false, now, now);
        users.create(user);
        return user;
    }

    public User login(AuthController.LoginRequest req) {
        User user = users.findByEmail(normalizeEmail(req.email())).orElse(null);
        boolean valid = passwordEncoder.matches(req.password(), user != null ? user.passwordHash() : dummyHash);
        if (user == null || !valid) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("Account is inactive");
        }
        return user;
    }

    /** Returns the user for a valid refresh token, or empty if the token or user is no longer valid. */
    public Optional<User> refresh(String refreshToken) {
        return jwtService.verify(refreshToken, JwtService.TokenType.REFRESH)
                .map(AuthUser::userId)
                .flatMap(users::findById)
                .filter(User::isActive);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
