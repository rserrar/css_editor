import { test, expect } from '@playwright/test';

test('editor and preview connect on same origin', async ({ browser }) => {
  const context = await browser.newContext();
  const logs = [];

  const attachLogs = (page, name) => {
    page.on('console', (msg) => logs.push(`[${name}:console:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => logs.push(`[${name}:pageerror] ${err.message}`));
    page.on('requestfailed', (req) => logs.push(`[${name}:requestfailed] ${req.url()} ${req.failure()?.errorText}`));
  };

  const session = 'PROVA123';
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
  const previewUrl = `${baseUrl}/example-web.html?session=${session}`;
  const editorUrl = `${baseUrl}/?session=${session}`;

  const editor = await context.newPage();
  attachLogs(editor, 'editor');
  await editor.goto(editorUrl, { waitUntil: 'domcontentloaded' });

  const popupPromise = context.waitForEvent('page');
  await editor.getByRole('textbox').fill(previewUrl);
  await editor.getByRole('button', { name: /Començar Edició|Start Editing|Empezar Edición/ }).click();

  const preview = await popupPromise;
  attachLogs(preview, 'preview');
  await preview.waitForLoadState('domcontentloaded');

  await editor.waitForTimeout(2500);

  const pageErrors = logs.filter((entry) => entry.includes('pageerror'));
  expect(pageErrors, `Browser errors detected:\n${logs.join('\n')}`).toEqual([]);

  await expect(editor.getByText(/Preview Connectada|Preview Connected|Preview Conectada/), `Handshake logs:\n${logs.join('\n')}`).toBeVisible();
  await expect(editor.getByRole('button', { name: /home\.title/ }), `Targets not loaded. Logs:\n${logs.join('\n')}`).toBeVisible();

  await editor.getByRole('button', { name: /home\.title/ }).click();
  await expect(editor.getByText(/Tipografia i Visuals|Typography & Visuals|Tipografía y Visuales/)).toBeVisible();
  await editor.getByLabel(/^color-enabled$/i).first().click();
  const colorInput = editor.getByLabel(/^color$/i).first();
  await colorInput.fill('#ff0000');
  await editor.waitForTimeout(500);

  await expect(preview.locator('[data-editable-scope="home.hero"][data-editable="home.title"]')).toHaveCSS('color', 'rgb(255, 0, 0)');

  await context.close();
});
