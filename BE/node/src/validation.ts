import { z } from 'zod';

const passwordSchema = z.string().min(8, 'must be at least 8 characters').max(72, 'must be at most 72 characters');

// Indian mobile numbers only; stored normalized as +91XXXXXXXXXX.
const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'must be a valid Indian mobile number')
  .transform((p) => `+91${p.slice(-10)}`);

const nameSchema = z.string().trim().min(1, 'is required').max(50);

export const registerSchema = z.object({
  name: nameSchema,
  email: z.string().trim().toLowerCase().email().max(254),
  password: passwordSchema,
  phone: indianPhoneSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({ name: nameSchema });

export const createGuestSchema = z.object({ name: nameSchema });

// superadmin is only assigned via the seed script, never through the API
export const updateRoleSchema = z.object({ role: z.enum(['user', 'admin']) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const createPollSchema = z.object({
  question: z.string().trim().min(1).max(200),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(10),
  validUntil: z.iso.datetime({ offset: true }).refine((v) => new Date(v) > new Date(), 'must be in the future'),
  displayAfterClosed: z.boolean(),
});

export const voteSchema = z.object({ optionId: z.string().min(1).max(64) });

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isRealDate = (d: string) => {
  const t = Date.parse(`${d}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().startsWith(d);
};
const userIds = z.array(z.string().min(1).max(64)).min(1).max(20);
const goals = z.number().int().min(0).max(99);

export const gameSchema = z
  .object({
    date: z.string().regex(DATE, 'must be YYYY-MM-DD').refine(isRealDate, 'is not a valid date'),
    timeFrom: z.string().regex(TIME, 'must be HH:mm'),
    timeTo: z.string().regex(TIME, 'must be HH:mm'),
    location: z.string().trim().min(1).max(100),
    team1: userIds,
    team2: userIds,
    score: z.object({ team1: goals, team2: goals }).nullable().optional(),
  })
  .refine((g) => g.timeTo > g.timeFrom, { message: 'must be after timeFrom', path: ['timeTo'] })
  .refine((g) => new Set([...g.team1, ...g.team2]).size === g.team1.length + g.team2.length, {
    message: 'a player can only be picked once',
    path: ['team1'],
  });

export type GameInput = z.infer<typeof gameSchema>;
