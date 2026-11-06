import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// npm scripts run from BE/node, and the .env file is shared with the Java backend in BE/.
// ENV_FILE points elsewhere, e.g. ENV_FILE=../.env.aws to run the seed script against AWS.
dotenv.config({ path: process.env.ENV_FILE ?? path.resolve(process.cwd(), '../.env'), quiet: true });

const env = z
  .object({
    NODE_PORT: z.coerce.number().int().positive().default(4000),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
    DYNAMODB_ENDPOINT: z.string().optional(),
    AWS_REGION: z.string().default('ap-south-1'),
    TABLE_PREFIX: z.string().default('football_'),
  })
  .parse(process.env);

export const config = {
  port: env.NODE_PORT,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSeconds: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    refreshTtlSeconds: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  },
  corsOrigin: env.CORS_ORIGIN,
  cookieSecure: env.COOKIE_SECURE === 'true',
  dynamo: {
    endpoint: env.DYNAMODB_ENDPOINT,
    region: env.AWS_REGION,
    tablePrefix: env.TABLE_PREFIX,
  },
};
