import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // The unpublished GP SDK is linked via file:../remote-flows and imports
    // react/react-dom as peers. Without dedupe, Vite resolves a second React
    // copy through the symlink → "invalid hook call". Force a single instance.
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
  server: {
    middlewareMode: true,
    watch: {
      ignored: ['**/server/**'],
    },
    // Allow Vite to read the file:-linked SDK build outside the project root.
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  // Linked local dep changes on rebuild; don't pre-bundle/cache it.
  optimizeDeps: {
    exclude: ['@remoteoss/remote-flows'],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server/**/*.test.ts'],
  },
});
