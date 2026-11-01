import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { currentUser, requireAdmin } from '../auth/middleware.js';
import { HttpError } from '../errors.js';
import { type Game, findGameById, listGames, saveGameWithStats, toGameDto } from '../repositories/games.js';
import { findUsersByIds } from '../repositories/users.js';
import { gameEndsAt, nowIso } from '../time.js';
import { type GameInput, gameSchema } from '../validation.js';

export const gamesRouter = Router();

const startKey = (g: Game) => `${g.date}T${g.timeFrom}`;

gamesRouter.get('/', async (req, res) => {
  const status = req.query.status;
  const now = new Date();
  const games = await listGames();
  const upcoming = games.filter((g) => gameEndsAt(g.date, g.timeTo) > now);
  const past = games.filter((g) => gameEndsAt(g.date, g.timeTo) <= now);
  upcoming.sort((a, b) => startKey(a).localeCompare(startKey(b)));
  past.sort((a, b) => startKey(b).localeCompare(startKey(a)));
  const result = status === 'upcoming' ? upcoming : status === 'past' ? past : [...upcoming, ...past];
  res.json(result.map(toGameDto));
});

gamesRouter.get('/:id', async (req, res) => {
  const game = await findGameById(req.params.id);
  if (!game) throw new HttpError(404, 'Game not found');
  res.json(toGameDto(game));
});

async function buildGame(input: GameInput, base: Pick<Game, 'id' | 'createdBy' | 'createdAt'>): Promise<Game> {
  const players = [...input.team1, ...input.team2];
  const found = await findUsersByIds(players);
  if (found.length !== players.length) throw new HttpError(400, 'One or more players do not exist');
  return {
    ...base,
    date: input.date,
    timeFrom: input.timeFrom,
    timeTo: input.timeTo,
    location: input.location,
    players,
    team1: input.team1,
    team2: input.team2,
    scoreTeam1: input.score?.team1,
    scoreTeam2: input.score?.team2,
    updatedAt: nowIso(),
  };
}

function rethrowConflict(err: unknown): never {
  if ((err as Error).name === 'TransactionCanceledException') {
    throw new HttpError(409, 'The game was changed by someone else. Reload and try again.');
  }
  throw err;
}

gamesRouter.post('/', requireAdmin, async (req, res) => {
  const input = gameSchema.parse(req.body);
  const game = await buildGame(input, { id: randomUUID(), createdBy: currentUser(req).userId, createdAt: nowIso() });
  await saveGameWithStats(game).catch(rethrowConflict);
  res.status(201).json(toGameDto(game));
});

gamesRouter.put('/:id', requireAdmin, async (req, res) => {
  const input = gameSchema.parse(req.body);
  const previous = await findGameById(String(req.params.id));
  if (!previous) throw new HttpError(404, 'Game not found');
  const game = await buildGame(input, {
    id: previous.id,
    createdBy: previous.createdBy,
    createdAt: previous.createdAt,
  });
  await saveGameWithStats(game, previous).catch(rethrowConflict);
  res.json(toGameDto(game));
});
