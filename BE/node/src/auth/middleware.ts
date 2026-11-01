import type { Request, RequestHandler } from 'express';
import { HttpError } from '../errors.js';
import { type AuthClaims, verifyToken } from './tokens.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required');
  req.auth = verifyToken(header.slice('Bearer '.length), 'access');
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.auth?.role !== 'admin') throw new HttpError(403, 'Admin access required');
  next();
};

export function currentUser(req: Request): AuthClaims {
  if (!req.auth) throw new HttpError(401, 'Authentication required');
  return req.auth;
}
