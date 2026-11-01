package com.football.api.poll;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.football.api.common.ApiException;
import com.football.api.common.Times;

@Service
public class PollService {

    private final PollRepository polls;

    public PollService(PollRepository polls) {
        this.polls = polls;
    }

    /** @param status "active", "closed", or null for all */
    public List<PollDto> list(String status, String userId) {
        Instant now = Instant.now();
        return polls.findAll().stream()
                .map(p -> PollDto.from(p, userId, now))
                .filter(p -> switch (status == null ? "" : status) {
                    case "active" -> !p.closed();
                    case "closed" -> p.closed();
                    default -> true;
                })
                // Active: closing soonest first. Closed: most recently closed first.
                .sorted((a, b) -> a.closed()
                        ? b.validUntil().compareTo(a.validUntil())
                        : a.validUntil().compareTo(b.validUntil()))
                .toList();
    }

    public PollDto create(PollController.CreatePollRequest req, String adminId) {
        Instant validUntil;
        try {
            validUntil = OffsetDateTime.parse(req.validUntil()).toInstant();
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("validUntil: must be an ISO-8601 date-time");
        }
        if (!validUntil.isAfter(Instant.now())) {
            throw ApiException.badRequest("validUntil: must be in the future");
        }

        List<Poll.Option> options = req.options().stream()
                .map(text -> new Poll.Option(UUID.randomUUID().toString(), text.trim()))
                .toList();
        Map<String, List<String>> votes = new LinkedHashMap<>();
        options.forEach(o -> votes.put(o.id(), List.of()));

        String now = Times.nowIso();
        Poll poll = new Poll(UUID.randomUUID().toString(), req.question().trim(), options, adminId, now, now,
                Times.iso(validUntil), req.displayAfterClosed(), votes, List.of());
        polls.create(poll);
        return PollDto.from(poll, adminId, Instant.now());
    }

    public PollDto vote(String pollId, String optionId, String userId) {
        Poll poll = polls.findById(pollId).orElseThrow(() -> ApiException.notFound("Poll not found"));
        if (poll.options().stream().noneMatch(o -> o.id().equals(optionId))) {
            throw ApiException.badRequest("Unknown option");
        }
        if (!Instant.parse(poll.validUntil()).isAfter(Instant.now())) {
            throw ApiException.conflict("Poll is closed");
        }
        if (poll.voterIds().contains(userId)) {
            throw ApiException.conflict("You have already voted");
        }
        // Lost a race with a concurrent vote or the poll closing
        Poll updated = polls.recordVote(pollId, optionId, userId, Times.nowIso())
                .orElseThrow(() -> ApiException.conflict(
                        "Your vote could not be recorded (already voted or poll closed)"));
        return PollDto.from(updated, userId, Instant.now());
    }
}
