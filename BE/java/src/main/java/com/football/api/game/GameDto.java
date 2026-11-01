package com.football.api.game;

import java.util.List;

public record GameDto(
        String id,
        String date,
        String timeFrom,
        String timeTo,
        String location,
        List<String> players,
        List<String> team1,
        List<String> team2,
        Score score,
        String createdBy,
        String createdAt,
        String updatedAt) {

    public record Score(int team1, int team2) {
    }

    public static GameDto from(Game g) {
        Score score = g.hasScore() ? new Score(g.scoreTeam1(), g.scoreTeam2()) : null;
        return new GameDto(g.id(), g.date(), g.timeFrom(), g.timeTo(), g.location(), g.players(), g.team1(),
                g.team2(), score, g.createdBy(), g.createdAt(), g.updatedAt());
    }
}
