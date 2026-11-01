import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';

// Colours taken from the RRFC crest: fort navy, flame red and orange
const RRFC = { navy: '#1e2a47', red: '#e2332b', orange: '#f7931e', cream: '#fdf6ee' };

const theme = createTheme({
  palette: {
    primary: { main: RRFC.navy },
    secondary: { main: RRFC.orange, contrastText: '#fff' },
    error: { main: RRFC.red },
    background: { default: RRFC.cream },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: `linear-gradient(90deg, ${RRFC.red} 0%, ${RRFC.orange} 100%)` },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        // Faded crest behind the whole app; pseudo-element so only the image is transparent
        'body::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          background: 'url(/logo.jpg) center / min(70vw, 520px) no-repeat',
          opacity: 0.08,
          // The JPG has a white background; multiply makes the white invisible
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          zIndex: -1,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
