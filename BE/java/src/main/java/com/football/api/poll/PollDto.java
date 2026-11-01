package com.football.api.poll;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Poll as returned to a specific user. {@code results} is null when the user isn't allowed to see them yet:
 * results show once the poll closes, or right after voting if displayAfterClosed is false.
 */
public record PollDto(
        String id,
        String question,
        List<Poll.Option> options,
        String createdBy,
        String createdAt,
        String updatedAt,
        String validUntil,
        boolean displayAfterClosed,
        boolean closed,
        boolean hasVoted,
        String myOptionId,
        List<Result> results) {

    public record Result(String optionId, int count, List<String> voterIds) {
    }

    public static PollDto from(Poll p, String userId, Instant now) {
        boolean closed = !Instant.parse(p.validUntil()).isAfter(now);
        String myOptionId = p.votes().entrySet().stream()
                .filter(e -> e.getValue().contains(userId))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
        boolean hasVoted = myOptionId != null;
        boolean showResults = closed || (hasVoted && !p.displayAfterClosed());

        List<Result> results = showResults
                ? p.options().stream().map(o -> {
                    List<String> voters = p.votes().getOrDefault(o.id(), List.of());
                    return new Result(o.id(), voters.size(), voters);
                }).toList()
                : null;

        return new PollDto(p.id(), p.question(), p.options(), p.createdBy(), p.createdAt(), p.updatedAt(),
                p.validUntil(), p.displayAfterClosed(), closed, hasVoted, myOptionId, results);
    }
}
