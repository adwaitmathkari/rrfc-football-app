package com.football.api.config;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@Configuration
public class DynamoDbConfig {

    /** Table names shared with the Node backend. */
    public record Tables(String users, String polls, String games) {
    }

    @Bean
    public DynamoDbClient dynamoDbClient(AppProperties props) {
        var dynamo = props.dynamo();
        var builder = DynamoDbClient.builder().region(Region.of(dynamo.region()));
        if (StringUtils.hasText(dynamo.endpoint())) {
            builder.endpointOverride(URI.create(dynamo.endpoint()));
        }
        if (StringUtils.hasText(dynamo.accessKeyId())) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(dynamo.accessKeyId(), dynamo.secretAccessKey())));
        }
        return builder.build();
    }

    @Bean
    public Tables tables(AppProperties props) {
        String prefix = props.dynamo().tablePrefix();
        return new Tables(prefix + "users", prefix + "polls", prefix + "games");
    }
}
