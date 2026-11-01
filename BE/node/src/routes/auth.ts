import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { REFRESH_COOKIE, clearSession, sendSession, verifyToken } from '../auth/tokens.js';
import { HttpError } from '../errors.js';
import { type User, createUser, findUserByEmail, findUserById, phoneExists } from '../repositories/users.js';
import { nowIso } from '../time.js';
import { loginSchema, registerSchema } from '../validation.js';

export const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', BCRYPT_ROUNDS);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  if (await findUserByEmail(input.email)) throw new HttpError(409, 'Email is already registered');
  if (await phoneExists(input.phone)) throw new HttpError(409, 'Phone number is already registered');

  const now = nowIso();
  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    phone: input.phone,
    role: 'user',
    status: 'active',
    wins: 0,
    losses: 0,
    draws: 0,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  };
  await createUser(user);
  sendSession(res, user, 201);
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await findUserByEmail(email);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new HttpError(403, 'Account is inactive');
  sendSession(res, user);
});

authRouter.post('/refresh', async (req, res) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new HttpError(401, 'No session');
  const { userId } = verifyToken(token, 'refresh');
  const user = await findUserById(userId);
  if (!user || user.status !== 'active') {
    clearSession(res);
    throw new HttpError(401, 'Session is no longer valid');
  }
  sendSession(res, user);
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});
