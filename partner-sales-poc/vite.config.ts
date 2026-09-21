import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    middlewareMode: true,
  },
  test: {
    // 'node' rather than jsdom: the suite covers server-side routing logic.
    // Switch to 'jsdom' and add @testing-library/react when component tests
    // arrive — that needs extra deps, so it isn't wired up speculatively.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server/**/*.test.ts'],
  },
});
