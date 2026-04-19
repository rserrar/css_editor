/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: '.',
  testMatch: 'playwright*.spec.cjs',
  timeout: 30000,
  use: {
    headless: true,
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --strictPort --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
};
