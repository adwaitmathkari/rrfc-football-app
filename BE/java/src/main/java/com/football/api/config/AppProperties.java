package com.football.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code app.*} settings in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, String corsOrigin, boolean cookieSecure, Dynamo dynamo) {

    public record Jwt(String accessSecret, String refreshSecret, long accessTtlMinutes, long refreshTtlDays) {
    }

    public record Dynamo(String endpoint, String region, String tablePrefix, String accessKeyId,
            String secretAccessKey) {
    }
}
