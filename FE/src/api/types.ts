export type Role = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'deleted';

export interface User {
  id: string;
  name: string;
  /** null for guest players */
  email: string | null;
  /** null for guest players */
  phone: string | null;
  role: Role;
  status: UserStatus;
  /** Guest players are added by admins and can't log in */
  guest: boolean;
  wins: number;
  losses: number;
  draws: number;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  status: UserStatus;
  guest: boolean;
  wins: number;
  losses: number;
  draws: number;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface PollOption {
  id: string;
  text: string;
}

export interface PollResult {
  optionId: string;
  count: number;
  voterIds: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  displayAfterClosed: boolean;
  closed: boolean;
  hasVoted: boolean;
  myOptionId: string | null;
  /** null when the current user isn't allowed to see results yet */
  results: PollResult[] | null;
}

export interface CreatePollInput {
  question: string;
  options: string[];
  validUntil: string;
  displayAfterClosed: boolean;
}

export interface Score {
  team1: number;
  team2: number;
}

export interface Game {
  id: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  location: string;
  players: string[];
  /** Blue */
  team1: string[];
  /** White */
  team2: string[];
  score: Score | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameInput {
  date: string;
  timeFrom: string;
  timeTo: string;
  location: string;
  team1: string[];
  team2: string[];
  score: Score | null;
}
