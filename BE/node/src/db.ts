import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from './config.js';

const client = new DynamoDBClient({
  region: config.dynamo.region,
  endpoint: config.dynamo.endpoint || undefined,
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const tables = {
  users: `${config.dynamo.tablePrefix}users`,
  polls: `${config.dynamo.tablePrefix}polls`,
  games: `${config.dynamo.tablePrefix}games`,
};

// Fine for a small group; switch to indexed queries if tables grow large.
export async function scanAll<T>(tableName: string): Promise<T[]> {
  const items: T[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: startKey }));
    items.push(...((page.Items ?? []) as T[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return items;
}
