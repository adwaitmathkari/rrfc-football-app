import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { requireAdmin, requireAuth } from './auth/middleware.js';
import { config } from './config.js';
import { errorHandler } from './errors.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { gamesRouter } from './routes/games.js';
import { pollsRouter } from './routes/polls.js';
import { usersRouter } from './routes/users.js';

export const app = express();

app.use(helmet());
// Empty CORS_ORIGIN (as on AWS, where CloudFront serves FE and API from one domain) disables CORS
if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', backend: 'node' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);
app.use('/api/polls', requireAuth, pollsRouter);
app.use('/api/games', requireAuth, gamesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler);
