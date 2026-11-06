import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';
import serverless from 'serverless-http';

// Lambda entrypoint. JWT secrets live in SSM Parameter Store; they are loaded into process.env
// on cold start, before the app (and config.ts, which validates them) is imported.
const secretParams: Record<string, string> = {
  JWT_ACCESS_SECRET: requiredEnv('JWT_ACCESS_SECRET_PARAM'),
  JWT_REFRESH_SECRET: requiredEnv('JWT_REFRESH_SECRET_PARAM'),
};

const { Parameters = [] } = await new SSMClient({}).send(
  new GetParametersCommand({ Names: Object.values(secretParams), WithDecryption: true }),
);
for (const [envName, paramName] of Object.entries(secretParams)) {
  const value = Parameters.find((p) => p.Name === paramName)?.Value;
  if (!value) throw new Error(`SSM parameter ${paramName} not found`);
  process.env[envName] = value;
}

const { app } = await import('./app.js');

export const handler = serverless(app);

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}
