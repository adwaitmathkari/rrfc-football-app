import { request } from './client';
import type {
  CreatePollInput,
  Game,
  GameInput,
  Poll,
  PublicUser,
  RegisterInput,
  Session,
  User,
} from './types';

const id = (value: string) => encodeURIComponent(value);

export const api = {
  register: (input: RegisterInput) => request<Session>('POST', '/api/auth/register', input),
  login: (email: string, password: string) => request<Session>('POST', '/api/auth/login', { email, password }),
  logout: () => request<void>('POST', '/api/auth/logout'),

  updateMe: (name: string) => request<User>('PATCH', '/api/users/me', { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('POST', '/api/users/me/password', { currentPassword, newPassword }),
  myGames: () => request<Game[]>('GET', '/api/users/me/games'),
  users: () => request<PublicUser[]>('GET', '/api/users'),

  adminUsers: () => request<User[]>('GET', '/api/admin/users'),
  createGuest: (name: string) => request<User>('POST', '/api/admin/guests', { name }),
  updateRole: (userId: string, role: 'user' | 'admin') =>
    request<User>('PUT', `/api/admin/users/${id(userId)}/role`, { role }),
  deleteUser: (userId: string) => request<void>('DELETE', `/api/admin/users/${id(userId)}`),
  resetPassword: (userId: string) =>
    request<{ temporaryPassword: string }>('POST', `/api/admin/users/${id(userId)}/reset-password`),

  polls: (status: 'active' | 'closed') => request<Poll[]>('GET', `/api/polls?status=${status}`),
  createPoll: (input: CreatePollInput) => request<Poll>('POST', '/api/polls', input),
  vote: (pollId: string, optionId: string) => request<Poll>('POST', `/api/polls/${id(pollId)}/vote`, { optionId }),

  games: (status: 'upcoming' | 'past') => request<Game[]>('GET', `/api/games?status=${status}`),
  createGame: (input: GameInput) => request<Game>('POST', '/api/games', input),
  updateGame: (gameId: string, input: GameInput) => request<Game>('PUT', `/api/games/${id(gameId)}`, input),
};
