package com.football.api.user;

/** What other players can see about a user (no email or phone). */
public record PublicUserDto(String id, String name, String status, long wins, long losses, long draws) {

    public static PublicUserDto from(User u) {
        return new PublicUserDto(u.id(), u.name(), u.status(), u.wins(), u.losses(), u.draws());
    }
}
