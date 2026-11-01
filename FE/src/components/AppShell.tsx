import LogoutIcon from '@mui/icons-material/Logout';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import { AppBar, Container, IconButton, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const TABS = [
  { label: 'User', path: '/profile' },
  { label: 'Polls', path: '/polls' },
  { label: 'Games', path: '/games' },
  { label: 'Stats', path: '/stats' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const currentTab = TABS.find((t) => pathname.startsWith(t.path))?.path ?? false;

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2 }}>
          <SportsSoccerIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Football Group
          </Typography>
          {user && (
            <>
              <Typography sx={{ display: { xs: 'none', md: 'block' } }}>{user.name}</Typography>
              <Tooltip title="Log out">
                <IconButton color="inherit" onClick={() => void logout()}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
        {user && (
          <Tabs value={currentTab} variant="fullWidth" textColor="inherit" indicatorColor="secondary">
            {TABS.map((t) => (
              <Tab key={t.path} label={t.label} value={t.path} component={RouterLink} to={t.path} />
            ))}
          </Tabs>
        )}
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>

      {/* Closes itself once the password is changed (mustChangePassword becomes false) */}
      {user?.mustChangePassword && <ChangePasswordDialog open forced onClose={() => undefined} />}
    </>
  );
}
