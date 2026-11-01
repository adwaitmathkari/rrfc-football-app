import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { currentUser } from '../auth/middleware.js';
import { HttpError } from '../errors.js';
import { listGames, toGameDto } from '../repositories/games.js';
import {
  findUserById,
  listUsers,
  toPublicDto,
  toSelfDto,
  updatePassword,
  updateUserName,
} from '../repositories/users.js';
import { changePasswordSchema, updateProfileSchema } from '../validation.js';
import { BCRYPT_ROUNDS } from './auth.js';

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  const users = await listUsers();
  res.json(users.sort((a, b) => a.name.localeCompare(b.name)).map(toPublicDto));
});

usersRouter.get('/me', async (req, res) => {
  const user = await findUserById(currentUser(req).userId);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(toSelfDto(user));
});

usersRouter.patch('/me', async (req, res) => {
  const { name } = updateProfileSchema.parse(req.body);
  const user = await updateUserName(currentUser(req).userId, name);
  res.json(toSelfDto(user));
});

usersRouter.post('/me/password', async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await findUserById(currentUser(req).userId);
  if (!user) throw new HttpError(404, 'User not found');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect');
  }
  await updatePassword(user.id, await bcrypt.hash(newPassword, BCRYPT_ROUNDS), false);
  res.status(204).end();
});

usersRouter.get('/me/games', async (req, res) => {
  const { userId } = currentUser(req);
  const games = (await listGames())
    .filter((g) => g.players.includes(userId))
    .sort((a, b) => `${b.date}${b.timeFrom}`.localeCompare(`${a.date}${a.timeFrom}`));
  res.json(games.map(toGameDto));
});
