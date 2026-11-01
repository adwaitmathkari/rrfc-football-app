import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { refreshSession, setAccessToken, setSessionExpiredHandler } from '../api/client';
import { api } from '../api/endpoints';
import type { RegisterInput, Session, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  /** true while restoring the session from the refresh cookie on page load */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
    refreshSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  const startSession = (session: Session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login: async (email, password) => startSession(await api.login(email, password)),
    register: async (input) => startSession(await api.register(input)),
    logout: async () => {
      await api.logout().catch(() => undefined);
      setAccessToken(null);
      setUser(null);
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
