import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { api } from '../api/endpoints';
import type { Poll } from '../api/types';
import { CreatePollDialog } from '../components/CreatePollDialog';
import { PollCard } from '../components/PollCard';
import { useAuth } from '../context/AuthContext';
import { useLoad, useUsers } from '../hooks/useLoad';
import { isAdmin } from '../utils/roles';

const loadActive = () => api.polls('active');
const loadClosed = () => api.polls('closed');

export function PollsPage() {
  const { user } = useAuth();
  const { nameOf } = useUsers();
  const active = useLoad(loadActive);
  const closed = useLoad(loadClosed);
  const [creating, setCreating] = useState(false);

  const replace = (updated: Poll) =>
    active.setData((polls) => polls?.map((p) => (p.id === updated.id ? updated : p)));

  return (
    <Stack spacing={4}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Active polls</Typography>
          {isAdmin(user) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
              New poll
            </Button>
          )}
        </Stack>
        <PollList {...active} nameOf={nameOf} onUpdated={replace} empty="No active polls." />
      </Box>

      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Past polls
        </Typography>
        <PollList {...closed} nameOf={nameOf} empty="No past polls yet." />
      </Box>

      <CreatePollDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          void active.reload();
        }}
      />
    </Stack>
  );
}

interface PollListProps {
  data?: Poll[];
  loading: boolean;
  error: string | null;
  empty: string;
  nameOf: (id: string) => string;
  onUpdated?: (poll: Poll) => void;
}

function PollList({ data, loading, error, empty, nameOf, onUpdated }: PollListProps) {
  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data || data.length === 0) return <Typography color="text.secondary">{empty}</Typography>;
  return (
    <Stack spacing={2}>
      {data.map((poll) => (
        <PollCard key={poll.id} poll={poll} nameOf={nameOf} onUpdated={onUpdated} />
      ))}
    </Stack>
  );
}
