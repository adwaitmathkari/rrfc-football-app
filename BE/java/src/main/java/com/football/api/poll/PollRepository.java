package com.football.api.poll;

import static com.football.api.common.Attrs.bool;
import static com.football.api.common.Attrs.getBoolean;
import static com.football.api.common.Attrs.getString;
import static com.football.api.common.Attrs.getStrings;
import static com.football.api.common.Attrs.key;
import static com.football.api.common.Attrs.s;
import static com.football.api.common.Attrs.strings;
import static com.football.api.common.Attrs.toStrings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.football.api.config.DynamoDbConfig.Tables;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.ReturnValue;

@Repository
public class PollRepository {

    private final DynamoDbClient db;
    private final String table;

    public PollRepository(DynamoDbClient db, Tables tables) {
        this.db = db;
        this.table = tables.polls();
    }

    public Optional<Poll> findById(String id) {
        var response = db.getItem(r -> r.tableName(table).key(key(id)));
        return response.hasItem() ? Optional.of(fromItem(response.item())) : Optional.empty();
    }

    public List<Poll> findAll() {
        List<Poll> polls = new ArrayList<>();
        for (var item : db.scanPaginator(r -> r.tableName(table)).items()) {
            polls.add(fromItem(item));
        }
        return polls;
    }

    public void create(Poll poll) {
        db.putItem(r -> r.tableName(table).item(toItem(poll)).conditionExpression("attribute_not_exists(id)"));
    }

    /**
     * Atomically adds the vote. Returns empty if the condition fails
     * (user already voted, poll closed, or option doesn't exist).
     */
    public Optional<Poll> recordVote(String pollId, String optionId, String userId, String now) {
        try {
            var response = db.updateItem(r -> r.tableName(table)
                    .key(key(pollId))
                    .updateExpression("SET votes.#opt = list_append(votes.#opt, :voter), "
                            + "voterIds = list_append(voterIds, :voter), updatedAt = :now")
                    .conditionExpression(
                            "attribute_exists(votes.#opt) AND NOT contains(voterIds, :userId) AND validUntil > :now")
                    .expressionAttributeNames(Map.of("#opt", optionId))
                    .expressionAttributeValues(Map.of(
                            ":voter", strings(List.of(userId)),
                            ":userId", s(userId),
                            ":now", s(now)))
                    .returnValues(ReturnValue.ALL_NEW));
            return Optional.of(fromItem(response.attributes()));
        } catch (ConditionalCheckFailedException e) {
            return Optional.empty();
        }
    }

    static Map<String, AttributeValue> toItem(Poll p) {
        Map<String, AttributeValue> votes = new HashMap<>();
        p.votes().forEach((optionId, userIds) -> votes.put(optionId, strings(userIds)));

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", s(p.id()));
        item.put("question", s(p.question()));
        item.put("options", AttributeValue.fromL(p.options().stream()
                .map(o -> AttributeValue.fromM(Map.of("id", s(o.id()), "text", s(o.text()))))
                .toList()));
        item.put("createdBy", s(p.createdBy()));
        item.put("createdAt", s(p.createdAt()));
        item.put("updatedAt", s(p.updatedAt()));
        item.put("validUntil", s(p.validUntil()));
        item.put("displayAfterClosed", bool(p.displayAfterClosed()));
        item.put("votes", AttributeValue.fromM(votes));
        item.put("voterIds", strings(p.voterIds()));
        return item;
    }

    static Poll fromItem(Map<String, AttributeValue> item) {
        List<Poll.Option> options = item.get("options").l().stream()
                .map(av -> new Poll.Option(av.m().get("id").s(), av.m().get("text").s()))
                .toList();
        Map<String, List<String>> votes = new LinkedHashMap<>();
        item.get("votes").m().forEach((optionId, userIds) -> votes.put(optionId, toStrings(userIds)));

        return new Poll(
                getString(item, "id"),
                getString(item, "question"),
                options,
                getString(item, "createdBy"),
                getString(item, "createdAt"),
                getString(item, "updatedAt"),
                getString(item, "validUntil"),
                getBoolean(item, "displayAfterClosed"),
                votes,
                getStrings(item, "voterIds"));
    }
}
