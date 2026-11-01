package com.football.api.user;

/** What a user sees about themselves (never includes the password hash). */
public record UserDto(
        String id,
        String name,
        String email,
        String phone,
        String role,
        String status,
        long wins,
        long losses,
        long draws,
        boolean mustChangePassword,
        String createdAt,
        String updatedAt) {

    public static UserDto from(User u) {
        return new UserDto(u.id(), u.name(), u.email(), u.phone(), u.role(), u.status(), u.wins(), u.losses(),
                u.draws(), u.mustChangePassword(), u.createdAt(), u.updatedAt());
    }
}
