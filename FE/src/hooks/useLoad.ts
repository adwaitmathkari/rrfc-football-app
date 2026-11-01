import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import type { PublicUser } from '../api/types';
import { errorMessage } from '../utils/format';

/** Loads data on mount. Pass a stable function (module-level or useCallback). */
export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

/** All users, plus a quick id -> name lookup for polls and games. */
export function useUsers() {
  const { data, error, loading } = useLoad(api.users);
  const users = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map<string, PublicUser>(users.map((u) => [u.id, u])), [users]);
  const nameOf = useCallback((id: string) => byId.get(id)?.name ?? 'Unknown player', [byId]);
  return { users, nameOf, error, loading };
}
