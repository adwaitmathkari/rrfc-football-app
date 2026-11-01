package com.football.api.poll;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.football.api.security.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/polls")
public class PollController {

    public record CreatePollRequest(
            @NotBlank @Size(max = 200) String question,
            @NotNull @Size(min = 2, max = 10) List<@NotBlank @Size(max = 100) String> options,
            @NotBlank String validUntil,
            @NotNull Boolean displayAfterClosed) {
    }

    public record VoteRequest(@NotBlank @Size(max = 64) String optionId) {
    }

    private final PollService pollService;

    public PollController(PollService pollService) {
        this.pollService = pollService;
    }

    @GetMapping
    public List<PollDto> list(@AuthenticationPrincipal AuthUser me,
            @RequestParam(required = false) String status) {
        return pollService.list(status, me.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public PollDto create(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody CreatePollRequest body) {
        return pollService.create(body, me.userId());
    }

    @PostMapping("/{id}/vote")
    public PollDto vote(@AuthenticationPrincipal AuthUser me, @PathVariable String id,
            @Valid @RequestBody VoteRequest body) {
        return pollService.vote(id, body.optionId(), me.userId());
    }
}
