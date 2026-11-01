import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { currentUser, requireAdmin } from '../auth/middleware.js';
import { HttpError } from '../errors.js';
import { type Poll, createPoll, findPollById, listPolls, recordVote, toPollDto } from '../repositories/polls.js';
import { nowIso } from '../time.js';
import { createPollSchema, voteSchema } from '../validation.js';

export const pollsRouter = Router();

pollsRouter.get('/', async (req, res) => {
  const { userId } = currentUser(req);
  const status = req.query.status;
  const now = new Date();
  const polls = (await listPolls())
    .map((p) => toPollDto(p, userId, now))
    .filter((p) => (status === 'active' ? !p.closed : status === 'closed' ? p.closed : true))
    .sort((a, b) =>
      a.closed ? b.validUntil.localeCompare(a.validUntil) : a.validUntil.localeCompare(b.validUntil),
    );
  res.json(polls);
});

pollsRouter.post('/', requireAdmin, async (req, res) => {
  const input = createPollSchema.parse(req.body);
  const options = input.options.map((text) => ({ id: randomUUID(), text }));
  const now = nowIso();
  const poll: Poll = {
    id: randomUUID(),
    question: input.question,
    options,
    createdBy: currentUser(req).userId,
    createdAt: now,
    updatedAt: now,
    validUntil: new Date(input.validUntil).toISOString(),
    displayAfterClosed: input.displayAfterClosed,
    votes: Object.fromEntries(options.map((o) => [o.id, []])),
    voterIds: [],
  };
  await createPoll(poll);
  res.status(201).json(toPollDto(poll, poll.createdBy));
});

pollsRouter.post('/:id/vote', async (req, res) => {
  const { userId } = currentUser(req);
  const { optionId } = voteSchema.parse(req.body);
  const poll = await findPollById(req.params.id);
  if (!poll) throw new HttpError(404, 'Poll not found');
  if (!poll.options.some((o) => o.id === optionId)) throw new HttpError(400, 'Unknown option');
  if (new Date(poll.validUntil) <= new Date()) throw new HttpError(409, 'Poll is closed');
  if (poll.voterIds.includes(userId)) throw new HttpError(409, 'You have already voted');

  try {
    const updated = await recordVote(poll.id, optionId, userId, nowIso());
    res.json(toPollDto(updated, userId));
  } catch (err) {
    // Lost a race with a concurrent vote or the poll closing
    if ((err as Error).name === 'ConditionalCheckFailedException') {
      throw new HttpError(409, 'Your vote could not be recorded (already voted or poll closed)');
    }
    throw err;
  }
});
