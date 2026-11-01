package com.football.api.game;

import static com.football.api.common.Attrs.getIntegerOrNull;
import static com.football.api.common.Attrs.getString;
import static com.football.api.common.Attrs.getStrings;
import static com.football.api.common.Attrs.key;
import static com.football.api.common.Attrs.n;
import static com.football.api.common.Attrs.s;
import static com.football.api.common.Attrs.strings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.football.api.config.DynamoDbConfig.Tables;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.Put;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.TransactionCanceledException;
import software.amazon.awssdk.services.dynamodb.model.Update;

@Repository
public class GameRepository {

    /** Change to apply to one user's wins/losses/draws. */
    public record StatDelta(int wins, int losses, int draws) {
    }

    private final DynamoDbClient db;
    private final String table;
    private final String usersTable;

    public GameRepository(DynamoDbClient db, Tables tables) {
        this.db = db;
        this.table = tables.games();
        this.usersTable = tables.users();
    }

    public Optional<Game> findById(String id) {
        var response = db.getItem(r -> r.tableName(table).key(key(id)));
        return response.hasItem() ? Optional.of(fromItem(response.item())) : Optional.empty();
    }

    public List<Game> findAll() {
        List<Game> games = new ArrayList<>();
        for (var item : db.scanPaginator(r -> r.tableName(table)).items()) {
            games.add(fromItem(item));
        }
        return games;
    }

    /**
     * Saves the game and applies the stat changes in a single transaction.
     * When {@code previous} is given, the save only succeeds if nobody modified the game in the meantime.
     *
     * @return false if the transaction was rejected (concurrent edit)
     */
    public boolean saveWithStats(Game game, Game previous, Map<String, StatDelta> deltas) {
        var put = Put.builder().tableName(table).item(toItem(game));
        if (previous == null) {
            put.conditionExpression("attribute_not_exists(id)");
        } else {
            put.conditionExpression("updatedAt = :previousUpdatedAt")
                    .expressionAttributeValues(Map.of(":previousUpdatedAt", s(previous.updatedAt())));
        }

        List<TransactWriteItem> items = new ArrayList<>();
        items.add(TransactWriteItem.builder().put(put.build()).build());
        deltas.forEach((userId, d) -> items.add(TransactWriteItem.builder()
                .update(Update.builder()
                        .tableName(usersTable)
                        .key(key(userId))
                        .updateExpression("ADD wins :wins, losses :losses, draws :draws")
                        .conditionExpression("attribute_exists(id)")
                        .expressionAttributeValues(Map.of(
                                ":wins", n(d.wins()),
                                ":losses", n(d.losses()),
                                ":draws", n(d.draws())))
                        .build())
                .build()));

        try {
            db.transactWriteItems(r -> r.transactItems(items));
            return true;
        } catch (TransactionCanceledException e) {
            return false;
        }
    }

    static Map<String, AttributeValue> toItem(Game g) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", s(g.id()));
        item.put("date", s(g.date()));
        item.put("timeFrom", s(g.timeFrom()));
        item.put("timeTo", s(g.timeTo()));
        item.put("location", s(g.location()));
        item.put("players", strings(g.players()));
        item.put("team1", strings(g.team1()));
        item.put("team2", strings(g.team2()));
        if (g.hasScore()) {
            item.put("scoreTeam1", n(g.scoreTeam1()));
            item.put("scoreTeam2", n(g.scoreTeam2()));
        }
        item.put("createdBy", s(g.createdBy()));
        item.put("createdAt", s(g.createdAt()));
        item.put("updatedAt", s(g.updatedAt()));
        return item;
    }

    static Game fromItem(Map<String, AttributeValue> item) {
        return new Game(
                getString(item, "id"),
                getString(item, "date"),
                getString(item, "timeFrom"),
                getString(item, "timeTo"),
                getString(item, "location"),
                getStrings(item, "players"),
                getStrings(item, "team1"),
                getStrings(item, "team2"),
                getIntegerOrNull(item, "scoreTeam1"),
                getIntegerOrNull(item, "scoreTeam2"),
                getString(item, "createdBy"),
                getString(item, "createdAt"),
                getString(item, "updatedAt"));
    }
}
