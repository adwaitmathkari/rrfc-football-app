package com.football.api.user;

import java.util.Comparator;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.common.ApiException;
import com.football.api.game.GameDto;
import com.football.api.game.GameService;
import com.football.api.security.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/users")
public class UserController {

    public record UpdateProfileRequest(@NotBlank @Size(max = 50) String name) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotNull @Size(min = 8, max = 72) String newPassword) {
    }

    private final UserRepository users;
    private final GameService games;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository users, GameService games, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.games = games;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<PublicUserDto> list() {
        return users.findAll().stream()
                .sorted(Comparator.comparing(User::name, String.CASE_INSENSITIVE_ORDER))
                .map(PublicUserDto::from)
                .toList();
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthUser me) {
        return UserDto.from(load(me.userId()));
    }

    @PatchMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody UpdateProfileRequest body) {
        return UserDto.from(users.updateName(me.userId(), body.name().trim()));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthUser me,
            @Valid @RequestBody ChangePasswordRequest body) {
        User user = load(me.userId());
        if (!passwordEncoder.matches(body.currentPassword(), user.passwordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        users.updatePassword(user.id(), passwordEncoder.encode(body.newPassword()), false);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/games")
    public List<GameDto> myGames(@AuthenticationPrincipal AuthUser me) {
        return games.gamesForPlayer(me.userId());
    }

    private User load(String id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
