import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { useAuth } from './context/AuthContext';
import { GamesPage } from './pages/GamesPage';
import { LoginPage } from './pages/LoginPage';
import { PollsPage } from './pages/PollsPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { StatsPage } from './pages/StatsPage';

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/games" replace /> : <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameId" element={<GamesPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/games" replace />} />
      </Route>
    </Routes>
  );
}
