import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  retries: 0,
  use: {
    channel: 'chrome',
    viewport: { width: 360, height: 640 },
    baseURL: 'https://localhost:4173',
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
})
