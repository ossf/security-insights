const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium'
  },
  webServer: {
    command: 'cd docs && bundle exec jekyll build --source . --destination /tmp/security-insights-site && python3 -m http.server 4173 --bind 127.0.0.1 --directory /tmp/security-insights-site',
    url: 'http://127.0.0.1:4173/editor/',
    reuseExistingServer: false,
    timeout: 300_000
  }
});
