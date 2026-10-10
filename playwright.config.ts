import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';

// Eigene, frische Datenbank und eigene Ports – die lokale Entwicklungs-DB bleibt unberührt.
// Vite läuft auf 5001, weil der Server diesen Origin per CORS bereits erlaubt.
const API_PORT = 3101;
const WEB_PORT = 5001;
const DB = process.env.E2E_DB ?? path.join(os.tmpdir(), `sfc-e2e-${Date.now()}.sqlite3`);
process.env.E2E_DB = DB;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { PORT: String(API_PORT), DATABASE_PATH: DB, NODE_ENV: 'development', ADMIN_EMAILS: 'admin-desktop@example.com,admin-mobile@example.com' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
