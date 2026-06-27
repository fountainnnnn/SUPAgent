import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev only — in production set VITE_API_BASE to the backend service URL.
      '/api': 'http://localhost:8787',
    },
  },
  // Expose VITE_API_BASE so fetch calls can target the correct backend in production.
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_BASE ?? ''),
  },
});
