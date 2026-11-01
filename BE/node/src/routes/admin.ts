import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { HttpError } from '../errors.js';
import { findUserById, listUsers, toSelfDto, updatePassword } from '../repositories/users.js';
import { BCRYPT_ROUNDS } from './auth.js';

export const adminRouter = Router();

adminRouter.get('/users', async (_req, res) => {
  const users = await listUsers();
  res.json(users.sort((a, b) => a.name.localeCompare(b.name)).map(toSelfDto));
});

adminRouter.post('/users/:id/reset-password', async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  const temporaryPassword = randomBytes(9).toString('base64url');
  await updatePassword(user.id, await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS), true);
  res.json({ temporaryPassword });
});
