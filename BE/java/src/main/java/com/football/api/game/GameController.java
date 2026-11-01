package com.football.api.game;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.security.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private static final String TIME_PATTERN = "^([01]\\d|2[0-3]):[0-5]\\d$";

    public record GameRequest(
            @NotNull @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "must be YYYY-MM-DD") String date,
            @NotNull @Pattern(regexp = TIME_PATTERN, message = "must be HH:mm") String timeFrom,
            @NotNull @Pattern(regexp = TIME_PATTERN, message = "must be HH:mm") String timeTo,
            @NotBlank @Size(max = 100) String location,
            @NotNull @Size(min = 1, max = 20) List<@NotBlank @Size(max = 64) String> team1,
            @NotNull @Size(min = 1, max = 20) List<@NotBlank @Size(max = 64) String> team2,
            @Valid ScoreRequest score) {
    }

    public record ScoreRequest(
            @NotNull @Min(0) @Max(99) Integer team1,
            @NotNull @Min(0) @Max(99) Integer team2) {
    }

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public List<GameDto> list(@RequestParam(required = false) String status) {
        return gameService.list(status);
    }

    @GetMapping("/{id}")
    public GameDto get(@PathVariable String id) {
        return gameService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public GameDto create(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody GameRequest body) {
        return gameService.create(body, me.userId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public GameDto update(@PathVariable String id, @Valid @RequestBody GameRequest body) {
        return gameService.update(id, body);
    }
}
