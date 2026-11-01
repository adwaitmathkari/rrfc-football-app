import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, scanAll, tables } from '../db.js';

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  displayAfterClosed: boolean;
  // optionId -> userIds who picked it
  votes: Record<string, string[]>;
  voterIds: string[];
}

export async function findPollById(id: string): Promise<Poll | undefined> {
  const res = await db.send(new GetCommand({ TableName: tables.polls, Key: { id } }));
  return res.Item as Poll | undefined;
}

export const listPolls = (): Promise<Poll[]> => scanAll<Poll>(tables.polls);

export async function createPoll(poll: Poll): Promise<void> {
  await db.send(
    new PutCommand({ TableName: tables.polls, Item: poll, ConditionExpression: 'attribute_not_exists(id)' }),
  );
}

/** Atomically records a vote; throws ConditionalCheckFailedException if already voted, closed, or unknown option. */
export async function recordVote(pollId: string, optionId: string, userId: string, now: string): Promise<Poll> {
  const res = await db.send(
    new UpdateCommand({
      TableName: tables.polls,
      Key: { id: pollId },
      UpdateExpression:
        'SET votes.#opt = list_append(votes.#opt, :voter), voterIds = list_append(voterIds, :voter), updatedAt = :now',
      ConditionExpression: 'attribute_exists(votes.#opt) AND NOT contains(voterIds, :userId) AND validUntil > :now',
      ExpressionAttributeNames: { '#opt': optionId },
      ExpressionAttributeValues: { ':voter': [userId], ':userId': userId, ':now': now },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return res.Attributes as Poll;
}

export function toPollDto(poll: Poll, userId: string, now = new Date()) {
  const closed = new Date(poll.validUntil) <= now;
  const myOptionId = Object.entries(poll.votes).find(([, ids]) => ids.includes(userId))?.[0] ?? null;
  const hasVoted = myOptionId !== null;
  const showResults = closed || (hasVoted && !poll.displayAfterClosed);
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    createdBy: poll.createdBy,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    validUntil: poll.validUntil,
    displayAfterClosed: poll.displayAfterClosed,
    closed,
    hasVoted,
    myOptionId,
    results: showResults
      ? poll.options.map((o) => ({
          optionId: o.id,
          count: poll.votes[o.id]?.length ?? 0,
          voterIds: poll.votes[o.id] ?? [],
        }))
      : null,
  };
}
