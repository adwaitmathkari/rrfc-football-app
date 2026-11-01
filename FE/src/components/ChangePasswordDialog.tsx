import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { type FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

interface Props {
  open: boolean;
  /** When true the dialog can't be dismissed (temporary password set by an admin). */
  forced?: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, forced = false, onClose }: Props) {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== newPassword;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return;
    setSaving(true);
    setError(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      if (user) setUser({ ...user, mustChangePassword: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={forced ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit}>
        <DialogTitle>{forced ? 'Set a new password' : 'Change password'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {forced && <Alert severity="info">An admin reset your password. Please choose a new one.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={forced ? 'Temporary password' : 'Current password'}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="8–72 characters"
              slotProps={{ htmlInput: { minLength: 8, maxLength: 72 } }}
              required
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={mismatch}
              helperText={mismatch ? 'Passwords do not match' : ' '}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {!forced && <Button onClick={onClose}>Cancel</Button>}
          <Button type="submit" variant="contained" disabled={saving || mismatch}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
