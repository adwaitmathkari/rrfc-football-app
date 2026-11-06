package com.football.api.user;

import static com.football.api.common.Attrs.bool;
import static com.football.api.common.Attrs.getBoolean;
import static com.football.api.common.Attrs.getLong;
import static com.football.api.common.Attrs.getString;
import static com.football.api.common.Attrs.key;
import static com.football.api.common.Attrs.n;
import static com.football.api.common.Attrs.s;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.football.api.common.Times;
import com.football.api.config.DynamoDbConfig.Tables;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.BatchGetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.KeysAndAttributes;
import software.amazon.awssdk.services.dynamodb.model.ReturnValue;

@Repository
public class UserRepository {

    private final DynamoDbClient db;
    private final String table;

    public UserRepository(DynamoDbClient db, Tables tables) {
        this.db = db;
        this.table = tables.users();
    }

    public Optional<User> findById(String id) {
        var response = db.getItem(r -> r.tableName(table).key(key(id)));
        return response.hasItem() ? Optional.of(fromItem(response.item())) : Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        var response = db.query(r -> r.tableName(table)
                .indexName("email-index")
                .keyConditionExpression("email = :email")
                .expressionAttributeValues(Map.of(":email", s(email)))
                .limit(1));
        return response.items().stream().findFirst().map(UserRepository::fromItem);
    }

    public boolean phoneExists(String phone) {
        var response = db.query(r -> r.tableName(table)
                .indexName("phone-index")
                .keyConditionExpression("phone = :phone")
                .expressionAttributeValues(Map.of(":phone", s(phone)))
                .limit(1));
        return response.count() > 0;
    }

    public List<User> findAll() {
        List<User> users = new ArrayList<>();
        for (var item : db.scanPaginator(r -> r.tableName(table)).items()) {
            users.add(fromItem(item));
        }
        return users;
    }

    public List<User> findAllById(Collection<String> ids) {
        List<String> all = List.copyOf(ids);
        List<User> users = new ArrayList<>();
        // BatchGetItem accepts at most 100 keys per call
        for (int i = 0; i < all.size(); i += 100) {
            List<Map<String, AttributeValue>> keys = all.subList(i, Math.min(i + 100, all.size())).stream()
                    .map(id -> key(id))
                    .toList();
            while (!keys.isEmpty()) {
                var request = BatchGetItemRequest.builder()
                        .requestItems(Map.of(table, KeysAndAttributes.builder().keys(keys).build()))
                        .build();
                var response = db.batchGetItem(request);
                response.responses().getOrDefault(table, List.of()).forEach(item -> users.add(fromItem(item)));
                KeysAndAttributes unprocessed = response.unprocessedKeys().get(table);
                keys = unprocessed == null ? List.of() : unprocessed.keys();
            }
        }
        return users;
    }

    public void create(User user) {
        db.putItem(r -> r.tableName(table).item(toItem(user)).conditionExpression("attribute_not_exists(id)"));
    }

    public User updateName(String id, String name) {
        var response = db.updateItem(r -> r.tableName(table)
                .key(key(id))
                .updateExpression("SET #name = :name, updatedAt = :now")
                .conditionExpression("attribute_exists(id)")
                .expressionAttributeNames(Map.of("#name", "name"))
                .expressionAttributeValues(Map.of(":name", s(name), ":now", s(Times.nowIso())))
                .returnValues(ReturnValue.ALL_NEW));
        return fromItem(response.attributes());
    }

    public void updatePassword(String id, String passwordHash, boolean mustChangePassword) {
        db.updateItem(r -> r.tableName(table)
                .key(key(id))
                .updateExpression("SET passwordHash = :hash, mustChangePassword = :must, updatedAt = :now")
                .conditionExpression("attribute_exists(id)")
                .expressionAttributeValues(Map.of(
                        ":hash", s(passwordHash),
                        ":must", bool(mustChangePassword),
                        ":now", s(Times.nowIso()))));
    }

    public User updateRole(String id, String role) {
        var response = db.updateItem(r -> r.tableName(table)
                .key(key(id))
                .updateExpression("SET #role = :role, updatedAt = :now")
                .conditionExpression("attribute_exists(id)")
                .expressionAttributeNames(Map.of("#role", "role"))
                .expressionAttributeValues(Map.of(":role", s(role), ":now", s(Times.nowIso())))
                .returnValues(ReturnValue.ALL_NEW));
        return fromItem(response.attributes());
    }

    /** Removing email/phone/password blocks login and frees them for a new registration. */
    public void softDelete(String id) {
        db.updateItem(r -> r.tableName(table)
                .key(key(id))
                .updateExpression("SET #status = :deleted, updatedAt = :now REMOVE email, phone, passwordHash")
                .conditionExpression("attribute_exists(id)")
                .expressionAttributeNames(Map.of("#status", "status"))
                .expressionAttributeValues(Map.of(
                        ":deleted", s(User.STATUS_DELETED),
                        ":now", s(Times.nowIso()))));
    }

    static Map<String, AttributeValue> toItem(User u) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", s(u.id()));
        item.put("name", s(u.name()));
        // Omitted for guests; items without email/phone are simply left out of the GSIs
        if (u.email() != null) {
            item.put("email", s(u.email()));
        }
        if (u.passwordHash() != null) {
            item.put("passwordHash", s(u.passwordHash()));
        }
        if (u.phone() != null) {
            item.put("phone", s(u.phone()));
        }
        item.put("role", s(u.role()));
        item.put("status", s(u.status()));
        item.put("guest", bool(u.guest()));
        item.put("wins", n(u.wins()));
        item.put("losses", n(u.losses()));
        item.put("draws", n(u.draws()));
        item.put("mustChangePassword", bool(u.mustChangePassword()));
        item.put("createdAt", s(u.createdAt()));
        item.put("updatedAt", s(u.updatedAt()));
        return item;
    }

    static User fromItem(Map<String, AttributeValue> item) {
        return new User(
                getString(item, "id"),
                getString(item, "name"),
                getString(item, "email"),
                getString(item, "passwordHash"),
                getString(item, "phone"),
                getString(item, "role"),
                getString(item, "status"),
                getBoolean(item, "guest"),
                getLong(item, "wins"),
                getLong(item, "losses"),
                getLong(item, "draws"),
                getBoolean(item, "mustChangePassword"),
                getString(item, "createdAt"),
                getString(item, "updatedAt"));
    }
}
