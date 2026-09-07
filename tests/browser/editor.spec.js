const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const schemaSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'spec', 'schema.cue'),
  'utf8'
);
const yamlSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'node_modules', 'js-yaml', 'dist', 'js-yaml.min.js'),
  'utf8'
);
const exampleSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'examples', 'example-full.yml'),
  'utf8'
);

test.beforeEach(async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: schemaSource })
  );
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: yamlSource })
  );
});

test('keyboard users can move through the editor workflow', async ({ page }) => {
  await page.goto('/editor/');
  await expect(page.locator('#status-text')).toHaveText('Schema loaded');

  await page.getByRole('button', { name: 'Start Fresh' }).click();
  await page.getByRole('tab', { name: 'Wizard' }).click();
  await expect(page.locator('#wizard-editor')).toBeVisible();
  await expect(page.locator('.wizard-step-heading')).toHaveText('Header');

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.wizard-step-heading')).toHaveText('Project');

  await page.getByRole('tab', { name: 'Form Editor' }).click();
  await page.getByRole('tab', { name: 'Form Editor' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Wizard' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('malformed pasted YAML is reported without opening the editor', async ({ page }) => {
  await page.goto('/editor/');
  await expect(page.locator('#status-text')).toHaveText('Schema loaded');

  await page.locator('#yaml-paste').fill('header: [');
  await page.getByRole('button', { name: 'Load from Paste' }).click();
  await expect(page.locator('#status-text')).toContainText('Error:');
  await expect(page.locator('#editor-main')).toHaveClass(/hidden/);
});

test('valid YAML can be imported, edited, and downloaded', async ({ page }) => {
  await page.goto('/editor/');
  await expect(page.locator('#status-text')).toHaveText('Schema loaded');

  await page.locator('#yaml-paste').fill(exampleSource);
  await page.getByRole('button', { name: 'Load from Paste' }).click();
  await expect(page.locator('#editor-main')).toBeVisible();
  await expect(page.locator('#status-text')).toHaveText('Valid');

  const projectName = page.locator('[data-path="project.name"] input');
  await expect(projectName).toBeVisible();
  await projectName.fill('Updated Security Insights Project');

  await expect(page.locator('#yaml-output')).toContainText(
    'Updated Security Insights Project'
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const downloaded = await download;
  expect(downloaded.suggestedFilename()).toBe('security-insights.yml');
});

test('navigation submenus open from the keyboard', async ({ page }) => {
  await page.goto('/');
  const dropdown = page.locator('.nav-dropdown').first();
  await dropdown.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(dropdown).toHaveAttribute('open', '');
  await expect(dropdown.locator('a').first()).toBeVisible();
});
