import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import type { Game, PublicUser } from '../api/types';
import { errorMessage, type Team } from '../utils/format';
import { TeamChip } from './TeamChip';

const MAX_PLAYERS = 40;

interface Props {
  /** Game to edit; omit to create a new one */
  game?: Game;
  users: PublicUser[];
  onClose: () => void;
  onSaved: (game: Game) => void;
}

function initialTeams(game?: Game): Record<string, Team> {
  const teams: Record<string, Team> = {};
  game?.team1.forEach((id) => (teams[id] = 'blue'));
  game?.team2.forEach((id) => (teams[id] = 'white'));
  return teams;
}

/** Rendered only while open, so state starts fresh for each game. */
export function GameFormDialog({ game, users, onClose, onSaved }: Props) {
  const [date, setDate] = useState(game?.date ?? '');
  const [timeFrom, setTimeFrom] = useState(game?.timeFrom ?? '');
  const [timeTo, setTimeTo] = useState(game?.timeTo ?? '');
  const [location, setLocation] = useState(game?.location ?? '');
  const [selected, setSelected] = useState<string[]>(game?.players ?? []);
  const [teams, setTeams] = useState<Record<string, Team>>(() => initialTeams(game));
  const [scoreBlue, setScoreBlue] = useState(game?.score ? String(game.score.team1) : '');
  const [scoreWhite, setScoreWhite] = useState(game?.score ? String(game.score.team2) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active users, plus anyone already in this game even if they've since been deactivated
  const selectable = useMemo(
    () => users.filter((u) => u.status === 'active' || game?.players.includes(u.id)),
    [users, game],
  );
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown player';

  const blue = selected.filter((id) => teams[id] === 'blue');
  const white = selected.filter((id) => teams[id] === 'white');
  const unassigned = selected.length - blue.length - white.length;
  const hasScore = scoreBlue !== '' || scoreWhite !== '';

  const problems: string[] = [];
  if (selected.length < 2) problems.push('Select at least 2 players.');
  if (unassigned > 0) problems.push('Assign every selected player to Blue or White.');
  if (unassigned === 0 && (blue.length === 0 || white.length === 0)) problems.push('Each team needs at least 1 player.');
  if (timeFrom && timeTo && timeTo <= timeFrom) problems.push('End time must be after start time.');
  if (hasScore && (scoreBlue === '' || scoreWhite === '')) problems.push('Enter both scores or neither.');

  const togglePlayer = (id: string) => {
    if (selected.includes(id)) {
      setSelected((s) => s.filter((x) => x !== id));
      setTeams(({ [id]: _removed, ...rest }) => rest);
    } else if (selected.length < MAX_PLAYERS) {
      setSelected((s) => [...s, id]);
    }
  };

  // Unassigned -> Blue -> White -> Blue ...
  const toggleTeam = (id: string) => setTeams((t) => ({ ...t, [id]: t[id] === 'blue' ? 'white' : 'blue' }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (problems.length > 0) return;
    setSaving(true);
    setError(null);
    const input = {
      date,
      timeFrom,
      timeTo,
      location: location.trim(),
      team1: blue,
      team2: white,
      score: hasScore ? { team1: Number(scoreBlue), team2: Number(scoreWhite) } : null,
    };
    try {
      onSaved(game ? await api.updateGame(game.id, input) : await api.createGame(input));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <form onSubmit={submit}>
        <DialogTitle>{game ? 'Edit game' : 'New game'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                label="From"
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                label="To"
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                sx={{ flex: 1 }}
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">1. Select players ({selected.length})</Typography>
                <Paper variant="outlined" sx={{ maxHeight: 320, overflow: 'auto' }}>
                  <List dense disablePadding>
                    {selectable.map((u) => (
                      <ListItemButton key={u.id} onClick={() => togglePlayer(u.id)}>
                        <ListItemIcon>
                          <Checkbox edge="start" checked={selected.includes(u.id)} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText primary={u.name} secondary={u.guest ? 'Guest' : undefined} />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">2. Pick teams</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click a player to toggle between Blue and White.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 40 }}>
                  {selected.map((id) => (
                    <TeamChip key={id} team={teams[id] ?? null} label={nameOf(id)} onClick={() => toggleTeam(id)} />
                  ))}
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Blue: {blue.length} · White: {white.length}
                  {unassigned > 0 && ` · Unassigned: ${unassigned}`}
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                3. Score (optional — enter after the game)
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Blue"
                  type="number"
                  value={scoreBlue}
                  onChange={(e) => setScoreBlue(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: 99 } }}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="White"
                  type="number"
                  value={scoreWhite}
                  onChange={(e) => setScoreWhite(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: 99 } }}
                  sx={{ width: 120 }}
                />
              </Stack>
            </Box>

            {problems.length > 0 && (
              <Alert severity="warning">
                {problems.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || problems.length > 0}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
