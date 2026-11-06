package com.football.api.user;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.common.ApiException;
import com.football.api.common.Times;
import com.football.api.security.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Admin endpoints (ADMIN or SUPERADMIN via SecurityConfig); some are SUPERADMIN-only. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    public record TemporaryPasswordResponse(String temporaryPassword) {
    }

    public record CreateGuestRequest(@NotBlank @Size(max = 50) String name) {
    }

    // superadmin is only assigned via the seed script, never through the API
    public record UpdateRoleRequest(
            @NotNull @Pattern(regexp = "user|admin", message = "must be user or admin") String role) {
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
                .filter(u -> !u.isDeleted())
                .sorted(Comparator.comparing(User::name, String.CASE_INSENSITIVE_ORDER))
                .map(UserDto::from)
                .toList();
    }

    @PostMapping("/guests")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createGuest(@Valid @RequestBody CreateGuestRequest body) {
        String now = Times.nowIso();
        User guest = new User(UUID.randomUUID().toString(), body.name().trim(), null, null, null, User.ROLE_USER,
                User.STATUS_ACTIVE, true, 0, 0, 0, false, now, now);
        users.create(guest);
        return UserDto.from(guest);
    }

    @PostMapping("/users/{id}/reset-password")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public TemporaryPasswordResponse resetPassword(@PathVariable String id) {
        User user = findExisting(id);
        if (user.guest()) {
            throw ApiException.badRequest("Guest players cannot log in");
        }
        byte[] bytes = new byte[9];
        RANDOM.nextBytes(bytes);
        String temporaryPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        users.updatePassword(user.id(), passwordEncoder.encode(temporaryPassword), true);
        return new TemporaryPasswordResponse(temporaryPassword);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public UserDto updateRole(@AuthenticationPrincipal AuthUser me, @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest body) {
        User user = findExisting(id);
        if (user.id().equals(me.userId())) {
            throw ApiException.badRequest("You cannot change your own role");
        }
        if (user.guest()) {
            throw ApiException.badRequest("Guest players cannot be admins");
        }
        if (User.ROLE_SUPERADMIN.equals(user.role())) {
            throw ApiException.badRequest("A super admin's role cannot be changed");
        }
        return UserDto.from(users.updateRole(user.id(), body.role()));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@AuthenticationPrincipal AuthUser me, @PathVariable String id) {
        User user = findExisting(id);
        if (user.id().equals(me.userId())) {
            throw ApiException.badRequest("You cannot delete yourself");
        }
        if (User.ROLE_SUPERADMIN.equals(user.role())) {
            throw ApiException.badRequest("A super admin cannot be deleted");
        }
        users.softDelete(user.id());
    }

    private User findExisting(String id) {
        return users.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
