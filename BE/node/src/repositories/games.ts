import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { db, scanAll, tables } from '../db.js';

export interface Game {
  id: string;
  date: string; // YYYY-MM-DD
  timeFrom: string; // HH:mm
  timeTo: string; // HH:mm
  location: string;
  players: string[];
  team1: string[]; // Blue
  team2: string[]; // White
  scoreTeam1?: number | null;
  scoreTeam2?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type Outcome = 'wins' | 'losses' | 'draws';
type StatDelta = Record<Outcome, number>;

export async function findGameById(id: string): Promise<Game | undefined> {
  const res = await db.send(new GetCommand({ TableName: tables.games, Key: { id } }));
  return res.Item as Game | undefined;
}

export const listGames = (): Promise<Game[]> => scanAll<Game>(tables.games);

const hasScore = (g: Game | undefined): g is Game & { scoreTeam1: number; scoreTeam2: number } =>
  g != null && g.scoreTeam1 != null && g.scoreTeam2 != null;

function outcomesOf(game: Game | undefined): Map<string, Outcome> {
  const result = new Map<string, Outcome>();
  if (!hasScore(game)) return result;
  const [team1Outcome, team2Outcome]: Outcome[] =
    game.scoreTeam1 > game.scoreTeam2
      ? ['wins', 'losses']
      : game.scoreTeam1 < game.scoreTeam2
        ? ['losses', 'wins']
        : ['draws', 'draws'];
  game.team1.forEach((id) => result.set(id, team1Outcome));
  game.team2.forEach((id) => result.set(id, team2Outcome));
  return result;
}

/** Per-user change in wins/losses/draws when a game goes from `previous` to `next`. */
function statDeltas(previous: Game | undefined, next: Game): Map<string, StatDelta> {
  const deltas = new Map<string, StatDelta>();
  const bump = (userId: string, outcome: Outcome, by: number) => {
    const delta = deltas.get(userId) ?? { wins: 0, losses: 0, draws: 0 };
    delta[outcome] += by;
    deltas.set(userId, delta);
  };
  outcomesOf(previous).forEach((outcome, userId) => bump(userId, outcome, -1));
  outcomesOf(next).forEach((outcome, userId) => bump(userId, outcome, 1));
  for (const [userId, d] of deltas) {
    if (d.wins === 0 && d.losses === 0 && d.draws === 0) deltas.delete(userId);
  }
  return deltas;
}

/**
 * Saves the game and adjusts player stats in one transaction.
 * When `previous` is given, the write only succeeds if the game was not modified in the meantime.
 */
export async function saveGameWithStats(game: Game, previous?: Game): Promise<void> {
  const gameWrite = {
    Put: {
      TableName: tables.games,
      Item: game,
      ...(previous
        ? { ConditionExpression: 'updatedAt = :previousUpdatedAt', ExpressionAttributeValues: { ':previousUpdatedAt': previous.updatedAt } }
        : { ConditionExpression: 'attribute_not_exists(id)' }),
    },
  };

  const statWrites = [...statDeltas(previous, game)].map(([userId, d]) => ({
    Update: {
      TableName: tables.users,
      Key: { id: userId },
      UpdateExpression: 'ADD wins :wins, losses :losses, draws :draws',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: { ':wins': d.wins, ':losses': d.losses, ':draws': d.draws },
    },
  }));

  await db.send(new TransactWriteCommand({ TransactItems: [gameWrite, ...statWrites] }));
}

export const toGameDto = (g: Game) => ({
  id: g.id,
  date: g.date,
  timeFrom: g.timeFrom,
  timeTo: g.timeTo,
  location: g.location,
  players: g.players,
  team1: g.team1,
  team2: g.team2,
  score: hasScore(g) ? { team1: g.scoreTeam1, team2: g.scoreTeam2 } : null,
  createdBy: g.createdBy,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
});
