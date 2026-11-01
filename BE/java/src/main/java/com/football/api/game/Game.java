package com.football.api.game;

import java.util.List;

/** A row in the games table. team1 is Blue, team2 is White. Scores are null until the result is entered. */
public record Game(
        String id,
        String date,
        String timeFrom,
        String timeTo,
        String location,
        List<String> players,
        List<String> team1,
        List<String> team2,
        Integer scoreTeam1,
        Integer scoreTeam2,
        String createdBy,
        String createdAt,
        String updatedAt) {

    public boolean hasScore() {
        return scoreTeam1 != null && scoreTeam2 != null;
    }
}
