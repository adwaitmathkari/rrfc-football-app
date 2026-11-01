package com.football.api.poll;

import java.util.List;
import java.util.Map;

/** A row in the polls table. {@code votes} maps optionId to the ids of users who picked it. */
public record Poll(
        String id,
        String question,
        List<Option> options,
        String createdBy,
        String createdAt,
        String updatedAt,
        String validUntil,
        boolean displayAfterClosed,
        Map<String, List<String>> votes,
        List<String> voterIds) {

    public record Option(String id, String text) {
    }
}
