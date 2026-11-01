import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../api/endpoints';
import type { Game } from '../api/types';
import { GameCard } from '../components/GameCard';
import { GameFormDialog } from '../components/GameFormDialog';
import { useAuth } from '../context/AuthContext';
import { useLoad, useUsers } from '../hooks/useLoad';

const loadUpcoming = () => api.games('upcoming');
const loadPast = () => api.games('past');

export function GamesPage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { users, nameOf } = useUsers();
  const upcoming = useLoad(loadUpcoming);
  const past = useLoad(loadPast);
  // null = closed, undefined game = creating
  const [editing, setEditing] = useState<{ game?: Game } | null>(null);
  const isAdmin = user?.role === 'admin';

  const onSaved = () => {
    setEditing(null);
    void upcoming.reload();
    void past.reload();
  };

  const renderList = (list: ReturnType<typeof useLoad<Game[]>>, empty: string) => {
    if (list.loading) return <CircularProgress size={24} />;
    if (list.error) return <Alert severity="error">{list.error}</Alert>;
    if (!list.data || list.data.length === 0) return <Typography color="text.secondary">{empty}</Typography>;
    return (
      <Stack spacing={2}>
        {list.data.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            nameOf={nameOf}
            highlighted={game.id === gameId}
            onEdit={isAdmin ? () => setEditing({ game }) : undefined}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Upcoming games</Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})}>
              New game
            </Button>
          )}
        </Stack>
        {renderList(upcoming, 'No upcoming games.')}
      </Box>

      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Past games
        </Typography>
        {renderList(past, 'No past games yet.')}
      </Box>

      {editing && (
        <GameFormDialog game={editing.game} users={users} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </Stack>
  );
}
