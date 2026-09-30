import { defineConfig } from '@playwright/test';

// El backend debe estar arrancado (make db-up && make run-java), igual que para make verify.
// Variables opcionales: VITE_API_BASE (API), E2E_PORT (puerto del dev server de Vite).
const puerto = process.env.E2E_PORT || '5173';
const baseURL = `http://localhost:${puerto}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    channel: process.env.E2E_CHANNEL || 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${puerto} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
    env: { VITE_API_BASE: process.env.VITE_API_BASE || 'http://localhost:8080' },
  },
});
