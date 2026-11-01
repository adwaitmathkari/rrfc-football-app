import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const phoneInvalid = form.phone.length > 0 && !PHONE_PATTERN.test(form.phone);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phoneInvalid || mismatch) return;
    setSubmitting(true);
    setError(null);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      });
      navigate('/games', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Register
          </Typography>
          <form onSubmit={submit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Name"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                slotProps={{ htmlInput: { maxLength: 50 } }}
                required
                autoFocus
              />
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                required
              />
              <TextField
                label="Mobile number"
                type="tel"
                autoComplete="tel-national"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                error={phoneInvalid}
                helperText={phoneInvalid ? 'Enter a 10-digit Indian mobile number' : ' '}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
                  htmlInput: { inputMode: 'numeric' },
                }}
                required
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                helperText="8–72 characters"
                slotProps={{ htmlInput: { minLength: 8, maxLength: 72 } }}
                required
              />
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={set('confirm')}
                error={mismatch}
                helperText={mismatch ? 'Passwords do not match' : ' '}
                required
              />
              <Button type="submit" variant="contained" disabled={submitting || phoneInvalid || mismatch}>
                Create account
              </Button>
              <Typography variant="body2">
                Already registered?{' '}
                <Link component={RouterLink} to="/login">
                  Log in
                </Link>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
