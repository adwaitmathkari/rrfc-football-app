import type { Game } from '../api/types';

export const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** "2026-11-08" -> "Sat, 8 Nov 2026" */
export const formatDate = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export type Team = 'blue' | 'white';
export type Outcome = 'W' | 'L' | 'D';

export const teamOf = (game: Game, userId: string): Team | null =>
  game.team1.includes(userId) ? 'blue' : game.team2.includes(userId) ? 'white' : null;

export function outcomeFor(game: Game, userId: string): Outcome | null {
  const team = teamOf(game, userId);
  if (!game.score || !team) return null;
  const diff = game.score.team1 - game.score.team2;
  if (diff === 0) return 'D';
  return (diff > 0) === (team === 'blue') ? 'W' : 'L';
}

/** Value for <input type="datetime-local">, in the browser's local time. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
