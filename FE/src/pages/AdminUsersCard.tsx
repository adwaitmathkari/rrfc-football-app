import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { api } from '../api/endpoints';
import type { User } from '../api/types';
import { useLoad } from '../hooks/useLoad';
import { errorMessage } from '../utils/format';

/** Admin-only list of users with password reset. Roles/status are changed directly in the DB. */
export function AdminUsersCard() {
  const { data: users, error, loading } = useLoad(api.adminUsers);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [result, setResult] = useState<{ user: User; password: string } | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const reset = async (user: User) => {
    setConfirmUser(null);
    setResetError(null);
    try {
      const { temporaryPassword } = await api.resetPassword(user.id);
      setResult({ user, password: temporaryPassword });
    } catch (err) {
      setResetError(errorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Manage users
        </Typography>
        {loading && <CircularProgress size={24} />}
        {(error || resetError) && <Alert severity="error">{error ?? resetError}</Alert>}
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
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <Chip size="small" label={u.status} color={u.status === 'active' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setConfirmUser(u)}>
                        Reset password
                      </Button>
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
    </Card>
  );
}
