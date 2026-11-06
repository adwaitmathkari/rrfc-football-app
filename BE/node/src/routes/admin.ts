import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { currentUser, requireSuperAdmin } from '../auth/middleware.js';
import { HttpError } from '../errors.js';
import {
  type User,
  createUser,
  findUserById,
  listUsers,
  softDeleteUser,
  toSelfDto,
  updatePassword,
  updateRole,
} from '../repositories/users.js';
import { nowIso } from '../time.js';
import { createGuestSchema, updateRoleSchema } from '../validation.js';
import { BCRYPT_ROUNDS } from './auth.js';

export const adminRouter = Router();

async function findExistingUser(id: string): Promise<User> {
  const user = await findUserById(id);
  if (!user || user.status === 'deleted') throw new HttpError(404, 'User not found');
  return user;
}

adminRouter.get('/users', async (_req, res) => {
  const users = (await listUsers()).filter((u) => u.status !== 'deleted');
  res.json(users.sort((a, b) => a.name.localeCompare(b.name)).map(toSelfDto));
});

adminRouter.post('/guests', async (req, res) => {
  const { name } = createGuestSchema.parse(req.body);
  const now = nowIso();
  const guest: User = {
    id: randomUUID(),
    name,
    role: 'user',
    status: 'active',
    guest: true,
    wins: 0,
    losses: 0,
    draws: 0,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  };
  await createUser(guest);
  res.status(201).json(toSelfDto(guest));
});

adminRouter.post('/users/:id/reset-password', requireSuperAdmin, async (req, res) => {
  const user = await findExistingUser(String(req.params.id));
  if (user.guest) throw new HttpError(400, 'Guest players cannot log in');
  const temporaryPassword = randomBytes(9).toString('base64url');
  await updatePassword(user.id, await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS), true);
  res.json({ temporaryPassword });
});

adminRouter.put('/users/:id/role', requireSuperAdmin, async (req, res) => {
  const { role } = updateRoleSchema.parse(req.body);
  const user = await findExistingUser(String(req.params.id));
  if (user.id === currentUser(req).userId) throw new HttpError(400, 'You cannot change your own role');
  if (user.guest) throw new HttpError(400, 'Guest players cannot be admins');
  if (user.role === 'superadmin') throw new HttpError(400, "A super admin's role cannot be changed");
  res.json(toSelfDto(await updateRole(user.id, role)));
});

adminRouter.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  const user = await findExistingUser(String(req.params.id));
  if (user.id === currentUser(req).userId) throw new HttpError(400, 'You cannot delete yourself');
  if (user.role === 'superadmin') throw new HttpError(400, 'A super admin cannot be deleted');
  await softDeleteUser(user.id);
  res.status(204).end();
});
