import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { type FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import type { User } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLoad } from '../hooks/useLoad';
import { errorMessage } from '../utils/format';
import { isSuperAdmin } from '../utils/roles';

/** User list for admins. Only a super admin can reset passwords and grant/revoke admin. */
export function AdminUsersCard() {
  const { user: me } = useAuth();
  const superAdmin = isSuperAdmin(me);
  const { data: users, error, loading, reload } = useLoad(api.adminUsers);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [result, setResult] = useState<{ user: User; password: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addingGuest, setAddingGuest] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const remove = async (user: User) => {
    setDeletingUser(null);
    setActionError(null);
    try {
      await api.deleteUser(user.id);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const reset = async (user: User) => {
    setConfirmUser(null);
    setActionError(null);
    try {
      const { temporaryPassword } = await api.resetPassword(user.id);
      setResult({ user, password: temporaryPassword });
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const toggleAdmin = async (user: User) => {
    setActionError(null);
    try {
      await api.updateRole(user.id, user.role === 'admin' ? 'user' : 'admin');
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Manage users</Typography>
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAddingGuest(true)}>
            Add guest player
          </Button>
        </Stack>
        {loading && <CircularProgress size={24} />}
        {(error || actionError) && <Alert severity="error">{error ?? actionError}</Alert>}
        {users && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {u.name}
                      {u.guest && <Chip size="small" variant="outlined" label="Guest" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{u.email ?? '—'}</TableCell>
                    <TableCell>{u.phone ?? '—'}</TableCell>
                    <TableCell>
                      {u.role}
                      {superAdmin && !u.guest && u.role !== 'superadmin' && u.id !== me?.id && (
                        <Button size="small" sx={{ ml: 1 }} onClick={() => void toggleAdmin(u)}>
                          {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={u.status} color={u.status === 'active' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {superAdmin && !u.guest && (
                        <Button size="small" onClick={() => setConfirmUser(u)}>
                          Reset password
                        </Button>
                      )}
                      {superAdmin && u.role !== 'superadmin' && u.id !== me?.id && (
                        <Button size="small" color="error" onClick={() => setDeletingUser(u)}>
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <Dialog open={confirmUser !== null} onClose={() => setConfirmUser(null)}>
        <DialogTitle>Reset password?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmUser?.name} will get a temporary password and must choose a new one at their next login.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUser(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => confirmUser && void reset(confirmUser)}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletingUser !== null} onClose={() => setDeletingUser(null)}>
        <DialogTitle>Delete {deletingUser?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            They will no longer be able to log in and will disappear from player lists and stats. Their name stays on
            past games. Their email and phone number can be used to register again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deletingUser && void remove(deletingUser)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={result !== null} onClose={() => setResult(null)}>
        <DialogTitle>Temporary password</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Share this with {result?.user.name}. It won't be shown again.
          </DialogContentText>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 20 }}>{result?.password}</Typography>
            <Tooltip title="Copy">
              <IconButton onClick={() => result && void navigator.clipboard.writeText(result.password)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResult(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <AddGuestDialog
        open={addingGuest}
        onClose={() => setAddingGuest(false)}
        onCreated={() => {
          setAddingGuest(false);
          void reload();
        }}
      />
    </Card>
  );
}

function AddGuestDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createGuest(name.trim());
      setName('');
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit}>
        <DialogTitle>Add guest player</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <DialogContentText>
              Guests can be picked for games and appear in stats, but they can't log in.
            </DialogContentText>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 50 } }}
              required
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
