import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { type FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/games', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Log in
          </Typography>
          <form onSubmit={submit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="contained" disabled={submitting}>
                Log in
              </Button>
              <Typography variant="body2">
                No account?{' '}
                <Link component={RouterLink} to="/register">
                  Register
                </Link>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Forgot your password? Ask an admin to reset it.
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
