import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Fixed port: both backends allow this origin via CORS_ORIGIN in BE/.env
  server: { port: 5173, strictPort: true },
});
