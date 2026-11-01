import type { User } from '../api/types';

export const isAdmin = (user: User | null | undefined): boolean =>
  user?.role === 'admin' || user?.role === 'superadmin';

export const isSuperAdmin = (user: User | null | undefined): boolean => user?.role === 'superadmin';
