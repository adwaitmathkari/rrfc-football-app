import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks/useLoad';

type SortKey = 'wins' | 'losses' | 'draws';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'wins', label: 'Wins' },
  { key: 'losses', label: 'Losses' },
  { key: 'draws', label: 'Draws' },
];

export function StatsPage() {
  const { user } = useAuth();
  const { users, error, loading } = useUsers();
  const [sortKey, setSortKey] = useState<SortKey>('wins');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const sign = direction === 'asc' ? 1 : -1;
    return users
      .filter((u) => u.status === 'active')
      .sort((a, b) => sign * (a[sortKey] - b[sortKey]) || a.name.localeCompare(b.name));
  }, [users, sortKey, direction]);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection('desc');
    }
  };

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Player stats
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="right">Played</TableCell>
              {COLUMNS.map((c) => (
                <TableCell key={c.key} align="right" sortDirection={sortKey === c.key ? direction : false}>
                  <TableSortLabel
                    active={sortKey === c.key}
                    direction={sortKey === c.key ? direction : 'desc'}
                    onClick={() => sortBy(c.key)}
                  >
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((u, i) => (
              <TableRow key={u.id} selected={u.id === user?.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  {u.name}
                  {u.guest && <Chip size="small" variant="outlined" label="Guest" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell align="right">{u.wins + u.losses + u.draws}</TableCell>
                <TableCell align="right">{u.wins}</TableCell>
                <TableCell align="right">{u.losses}</TableCell>
                <TableCell align="right">{u.draws}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
