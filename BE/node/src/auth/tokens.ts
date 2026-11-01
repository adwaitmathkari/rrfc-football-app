import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import type { Role, User } from '../repositories/users.js';
import { toSelfDto } from '../repositories/users.js';

export interface AuthClaims {
  userId: string;
  role: Role;
}

type TokenType = 'access' | 'refresh';

export const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

const secretFor = (type: TokenType) => (type === 'access' ? config.jwt.accessSecret : config.jwt.refreshSecret);

function sign(user: User, type: TokenType): string {
  return jwt.sign({ role: user.role, typ: type }, secretFor(type), {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: type === 'access' ? config.jwt.accessTtlSeconds : config.jwt.refreshTtlSeconds,
  });
}

export function verifyToken(token: string, type: TokenType): AuthClaims {
  try {
    const payload = jwt.verify(token, secretFor(type), { algorithms: ['HS256'] });
    if (typeof payload === 'string' || payload.typ !== type || !payload.sub) throw new Error('Invalid token');
    return { userId: payload.sub, role: payload.role as Role };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

/** Sets the refresh cookie and returns the access token + user, used by login/register/refresh. */
export function sendSession(res: Response, user: User, status = 200): void {
  res.cookie(REFRESH_COOKIE, sign(user, 'refresh'), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: config.jwt.refreshTtlSeconds * 1000,
  });
  res.status(status).json({ accessToken: sign(user, 'access'), user: toSelfDto(user) });
}

export function clearSession(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  });
}
