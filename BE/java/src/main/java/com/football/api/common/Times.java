package com.football.api.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class Times {

    // Same format as JavaScript's toISOString(), so timestamps from both backends compare correctly as strings.
    private static final DateTimeFormatter ISO_MILLIS =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    // The group plays in India, so game dates and times are IST.
    private static final ZoneId GAME_ZONE = ZoneId.of("Asia/Kolkata");

    private Times() {
    }

    public static String iso(Instant instant) {
        return ISO_MILLIS.format(instant);
    }

    public static String nowIso() {
        return iso(Instant.now());
    }

    public static Instant gameEndsAt(String date, String timeTo) {
        return LocalDate.parse(date).atTime(LocalTime.parse(timeTo)).atZone(GAME_ZONE).toInstant();
    }
}
