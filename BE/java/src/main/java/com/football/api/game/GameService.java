package com.football.api.game;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.football.api.common.ApiException;
import com.football.api.common.Times;
import com.football.api.game.GameRepository.StatDelta;
import com.football.api.user.UserRepository;

@Service
public class GameService {

    private enum Outcome { WIN, LOSS, DRAW }

    private static final Comparator<Game> BY_START = Comparator.comparing(g -> g.date() + "T" + g.timeFrom());

    private final GameRepository games;
    private final UserRepository users;

    public GameService(GameRepository games, UserRepository users) {
        this.games = games;
        this.users = users;
    }

    /** @param status "upcoming", "past", or null for all (upcoming first) */
    public List<GameDto> list(String status) {
        Instant now = Instant.now();
        List<Game> all = games.findAll();
        List<Game> upcoming = all.stream()
                .filter(g -> Times.gameEndsAt(g.date(), g.timeTo()).isAfter(now))
                .sorted(BY_START)
                .toList();
        List<Game> past = all.stream()
                .filter(g -> !Times.gameEndsAt(g.date(), g.timeTo()).isAfter(now))
                .sorted(BY_START.reversed())
                .toList();

        List<Game> result = switch (status == null ? "" : status) {
            case "upcoming" -> upcoming;
            case "past" -> past;
            default -> {
                List<Game> combined = new ArrayList<>(upcoming);
                combined.addAll(past);
                yield combined;
            }
        };
        return result.stream().map(GameDto::from).toList();
    }

    public GameDto get(String id) {
        return GameDto.from(load(id));
    }

    public List<GameDto> gamesForPlayer(String userId) {
        return games.findAll().stream()
                .filter(g -> g.players().contains(userId))
                .sorted(BY_START.reversed())
                .map(GameDto::from)
                .toList();
    }

    public GameDto create(GameController.GameRequest req, String adminId) {
        Game game = build(req, UUID.randomUUID().toString(), adminId, Times.nowIso());
        save(game, null);
        return GameDto.from(game);
    }

    public GameDto update(String id, GameController.GameRequest req) {
        Game previous = load(id);
        Game game = build(req, previous.id(), previous.createdBy(), previous.createdAt());
        save(game, previous);
        return GameDto.from(game);
    }

    private Game load(String id) {
        return games.findById(id).orElseThrow(() -> ApiException.notFound("Game not found"));
    }

    private void save(Game game, Game previous) {
        if (!games.saveWithStats(game, previous, statDeltas(previous, game))) {
            throw ApiException.conflict("The game was changed by someone else. Reload and try again.");
        }
    }

    private Game build(GameController.GameRequest req, String id, String createdBy, String createdAt) {
        validate(req);
        List<String> players = new ArrayList<>(req.team1());
        players.addAll(req.team2());
        if (users.findAllById(players).size() != players.size()) {
            throw ApiException.badRequest("One or more players do not exist");
        }
        Integer score1 = req.score() == null ? null : req.score().team1();
        Integer score2 = req.score() == null ? null : req.score().team2();
        return new Game(id, req.date(), req.timeFrom(), req.timeTo(), req.location().trim(), players,
                req.team1(), req.team2(), score1, score2, createdBy, createdAt, Times.nowIso());
    }

    private static void validate(GameController.GameRequest req) {
        try {
            LocalDate.parse(req.date());
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("date: is not a valid date");
        }
        if (req.timeTo().compareTo(req.timeFrom()) <= 0) {
            throw ApiException.badRequest("timeTo: must be after timeFrom");
        }
        var unique = new HashSet<>(req.team1());
        unique.addAll(req.team2());
        if (unique.size() != req.team1().size() + req.team2().size()) {
            throw ApiException.badRequest("team1: a player can only be picked once");
        }
    }

    /** Per-user change in wins/losses/draws when a game goes from {@code previous} to {@code next}. */
    static Map<String, StatDelta> statDeltas(Game previous, Game next) {
        Map<String, int[]> totals = new HashMap<>();
        outcomesOf(previous).forEach((userId, o) -> totals.computeIfAbsent(userId, k -> new int[3])[o.ordinal()] -= 1);
        outcomesOf(next).forEach((userId, o) -> totals.computeIfAbsent(userId, k -> new int[3])[o.ordinal()] += 1);

        Map<String, StatDelta> deltas = new HashMap<>();
        totals.forEach((userId, t) -> {
            if (t[0] != 0 || t[1] != 0 || t[2] != 0) {
                deltas.put(userId, new StatDelta(t[Outcome.WIN.ordinal()], t[Outcome.LOSS.ordinal()],
                        t[Outcome.DRAW.ordinal()]));
            }
        });
        return deltas;
    }

    private static Map<String, Outcome> outcomesOf(Game game) {
        if (game == null || !game.hasScore()) {
            return Map.of();
        }
        int diff = Integer.compare(game.scoreTeam1(), game.scoreTeam2());
        Outcome team1 = diff > 0 ? Outcome.WIN : diff < 0 ? Outcome.LOSS : Outcome.DRAW;
        Outcome team2 = diff > 0 ? Outcome.LOSS : diff < 0 ? Outcome.WIN : Outcome.DRAW;

        Map<String, Outcome> result = new HashMap<>();
        game.team1().forEach(id -> result.put(id, team1));
        game.team2().forEach(id -> result.put(id, team2));
        return result;
    }
}
