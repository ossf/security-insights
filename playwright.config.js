const { defineConfig } = require('@playwright/test');

const port = process.env.PLAYWRIGHT_PORT || 4173;

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium'
  },
  webServer: {
    command: `si_site_dir="$(mktemp -d /tmp/security-insights-site.XXXXXX)" && trap 'rm -rf "$si_site_dir"' EXIT && cd docs && bundle exec jekyll build --source . --destination "$si_site_dir" && python3 -m http.server ${port} --bind 127.0.0.1 --directory "$si_site_dir"`,
    url: `http://127.0.0.1:${port}/editor/`,
    reuseExistingServer: false,
    timeout: 300_000
  }
});
