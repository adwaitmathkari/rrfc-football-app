package com.football.api.common;

import java.util.List;
import java.util.Map;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

/** Small helpers for converting between Java values and DynamoDB AttributeValues. */
public final class Attrs {

    private Attrs() {
    }

    public static AttributeValue s(String value) {
        return AttributeValue.fromS(value);
    }

    public static AttributeValue n(long value) {
        return AttributeValue.fromN(Long.toString(value));
    }

    public static AttributeValue bool(boolean value) {
        return AttributeValue.fromBool(value);
    }

    public static AttributeValue strings(List<String> values) {
        return AttributeValue.fromL(values.stream().map(AttributeValue::fromS).toList());
    }

    public static Map<String, AttributeValue> key(String id) {
        return Map.of("id", s(id));
    }

    public static String getString(Map<String, AttributeValue> item, String name) {
        AttributeValue value = item.get(name);
        return value == null ? null : value.s();
    }

    public static long getLong(Map<String, AttributeValue> item, String name) {
        AttributeValue value = item.get(name);
        return value == null || value.n() == null ? 0 : Long.parseLong(value.n());
    }

    public static Integer getIntegerOrNull(Map<String, AttributeValue> item, String name) {
        AttributeValue value = item.get(name);
        return value == null || value.n() == null ? null : Integer.valueOf(value.n());
    }

    public static boolean getBoolean(Map<String, AttributeValue> item, String name) {
        AttributeValue value = item.get(name);
        return value != null && Boolean.TRUE.equals(value.bool());
    }

    public static List<String> getStrings(Map<String, AttributeValue> item, String name) {
        return toStrings(item.get(name));
    }

    public static List<String> toStrings(AttributeValue value) {
        return value == null || !value.hasL() ? List.of() : value.l().stream().map(AttributeValue::s).toList();
    }
}
