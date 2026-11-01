package com.football.api.user;

/** A row in the users table. Stored with the same attribute names as the Node backend. */
public record User(
        String id,
        String name,
        String email,
        String passwordHash,
        String phone,
        String role,
        String status,
        long wins,
        long losses,
        long draws,
        boolean mustChangePassword,
        String createdAt,
        String updatedAt) {

    public static final String ROLE_USER = "user";
    public static final String ROLE_ADMIN = "admin";
    public static final String STATUS_ACTIVE = "active";

    public boolean isActive() {
        return STATUS_ACTIVE.equals(status);
    }
}
