package com.football.api.user;

/**
 * A row in the users table. Stored with the same attribute names as the Node backend.
 * Guest players have no email, phone or password and can't log in.
 */
public record User(
        String id,
        String name,
        String email,
        String passwordHash,
        String phone,
        String role,
        String status,
        boolean guest,
        long wins,
        long losses,
        long draws,
        boolean mustChangePassword,
        String createdAt,
        String updatedAt) {

    public static final String ROLE_USER = "user";
    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_SUPERADMIN = "superadmin";
    public static final String STATUS_ACTIVE = "active";
    // Deleted users keep their name and stats so past games still show them
    public static final String STATUS_DELETED = "deleted";

    public boolean isActive() {
        return STATUS_ACTIVE.equals(status);
    }

    public boolean isDeleted() {
        return STATUS_DELETED.equals(status);
    }
}
