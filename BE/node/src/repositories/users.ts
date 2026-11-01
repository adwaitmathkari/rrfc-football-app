import {
  BatchGetCommand,
  type BatchGetCommandOutput,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { db, scanAll, tables } from '../db.js';
import { nowIso } from '../time.js';

export type Role = 'user' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: Role;
  status: UserStatus;
  wins: number;
  losses: number;
  draws: number;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const res = await db.send(new GetCommand({ TableName: tables.users, Key: { id } }));
  return res.Item as User | undefined;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const res = await db.send(
    new QueryCommand({
      TableName: tables.users,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
    }),
  );
  return res.Items?.[0] as User | undefined;
}

export async function phoneExists(phone: string): Promise<boolean> {
  const res = await db.send(
    new QueryCommand({
      TableName: tables.users,
      IndexName: 'phone-index',
      KeyConditionExpression: 'phone = :phone',
      ExpressionAttributeValues: { ':phone': phone },
      Limit: 1,
    }),
  );
  return (res.Items?.length ?? 0) > 0;
}

export const listUsers = (): Promise<User[]> => scanAll<User>(tables.users);

export async function findUsersByIds(ids: string[]): Promise<User[]> {
  const users: User[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    let keys: Record<string, unknown>[] | undefined = ids.slice(i, i + 100).map((id) => ({ id }));
    while (keys && keys.length > 0) {
      const res: BatchGetCommandOutput = await db.send(
        new BatchGetCommand({ RequestItems: { [tables.users]: { Keys: keys } } }),
      );
      users.push(...((res.Responses?.[tables.users] ?? []) as User[]));
      keys = res.UnprocessedKeys?.[tables.users]?.Keys;
    }
  }
  return users;
}

export async function createUser(user: User): Promise<void> {
  await db.send(
    new PutCommand({ TableName: tables.users, Item: user, ConditionExpression: 'attribute_not_exists(id)' }),
  );
}

export async function updateUserName(id: string, name: string): Promise<User> {
  const res = await db.send(
    new UpdateCommand({
      TableName: tables.users,
      Key: { id },
      UpdateExpression: 'SET #name = :name, updatedAt = :now',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: { ':name': name, ':now': nowIso() },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return res.Attributes as User;
}

export async function updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
  await db.send(
    new UpdateCommand({
      TableName: tables.users,
      Key: { id },
      UpdateExpression: 'SET passwordHash = :hash, mustChangePassword = :must, updatedAt = :now',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: { ':hash': passwordHash, ':must': mustChangePassword, ':now': nowIso() },
    }),
  );
}

export const toSelfDto = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  status: u.status,
  wins: u.wins,
  losses: u.losses,
  draws: u.draws,
  mustChangePassword: u.mustChangePassword,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export const toPublicDto = (u: User) => ({
  id: u.id,
  name: u.name,
  status: u.status,
  wins: u.wins,
  losses: u.losses,
  draws: u.draws,
});
