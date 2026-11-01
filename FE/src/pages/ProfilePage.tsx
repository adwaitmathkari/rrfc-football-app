import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { api } from '../api/endpoints';
import type { User } from '../api/types';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';
import { TeamChip } from '../components/TeamChip';
import { useAuth } from '../context/AuthContext';
import { useLoad } from '../hooks/useLoad';
import { errorMessage, formatDate, outcomeFor, teamOf } from '../utils/format';
import { isAdmin } from '../utils/roles';
import { AdminUsersCard } from './AdminUsersCard';

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Stack spacing={3}>
      <ProfileCard user={user} />
      <MatchHistory userId={user.id} />
      {isAdmin(user) && <AdminUsersCard />}
    </Stack>
  );
}

function ProfileCard({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      setUser(await api.updateMe(name.trim()));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const played = user.wins + user.losses + user.draws;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {editing ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                size="small"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 50 } }}
                autoFocus
              />
              <Button variant="contained" onClick={save} disabled={saving || !name.trim()}>
                Save
              </Button>
              <Button
                onClick={() => {
                  setName(user.name);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h5">{user.name}</Typography>
              <IconButton size="small" onClick={() => setEditing(true)} aria-label="Edit name">
                <EditIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            <Chip size="small" label={user.role} color={isAdmin(user) ? 'secondary' : 'default'} />
            <Chip size="small" label={user.status} color={user.status === 'active' ? 'success' : 'default'} />
          </Stack>

          <Box>
            <Typography color="text.secondary">Email: {user.email}</Typography>
            <Typography color="text.secondary">Phone: {user.phone}</Typography>
          </Box>

          <Typography>
            Played {played} · <strong>{user.wins}</strong> W · <strong>{user.losses}</strong> L ·{' '}
            <strong>{user.draws}</strong> D
          </Typography>

          <Box>
            <Button variant="outlined" onClick={() => setPasswordOpen(true)}>
              Change password
            </Button>
          </Box>
        </Stack>
      </CardContent>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </Card>
  );
}

const outcomeColor = { W: 'success', L: 'error', D: 'default' } as const;

function MatchHistory({ userId }: { userId: string }) {
  const { data: games, error, loading } = useLoad(api.myGames);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Match history
        </Typography>
        {loading && <CircularProgress size={24} />}
        {error && <Alert severity="error">{error}</Alert>}
        {games && games.length === 0 && <Typography color="text.secondary">No matches yet.</Typography>}
        {games && games.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Match</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Score (Blue–White)</TableCell>
                  <TableCell>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {games.map((g) => {
                  const team = teamOf(g, userId);
                  const outcome = outcomeFor(g, userId);
                  return (
                    <TableRow key={g.id}>
                      <TableCell>
                        <Link component={RouterLink} to={`/games/${g.id}`}>
                          #{g.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(g.date)}</TableCell>
                      <TableCell>{g.location}</TableCell>
                      <TableCell>
                        <TeamChip team={team} label={team === 'blue' ? 'Blue' : 'White'} />
                      </TableCell>
                      <TableCell>{g.score ? `${g.score.team1} – ${g.score.team2}` : '—'}</TableCell>
                      <TableCell>
                        {outcome ? <Chip size="small" label={outcome} color={outcomeColor[outcome]} /> : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
