import { test, expect } from '@playwright/test';

async function setupOpenerHarness(page) {
  await page.goto('/preview-harness.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__previewHarness = { messages: [], previewRef: null };
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'object') {
        window.__previewHarness.messages.push(event.data);
      }
    });
  });
}

async function openPreviewFromHarness(page, session) {
  await page.evaluate((currentSession) => {
    window.__previewHarness.previewRef = window.open(`/example-web.html?session=${currentSession}`, 'live-style-preview');
  }, session);
}

async function sendEditorMessage(page, session, type, payload = {}) {
  await page.evaluate(({ currentSession, currentType, currentPayload }) => {
    window.__previewHarness.previewRef.postMessage({
      ...currentPayload,
      type: currentType,
      sessionId: currentSession,
      source: 'editor',
      timestamp: Date.now(),
    }, window.location.origin);
  }, { currentSession: session, currentType: type, currentPayload: payload });
}

async function waitForMessage(page, type) {
  await page.waitForFunction((expectedType) => {
    return Array.isArray(window.__previewHarness?.messages)
      && window.__previewHarness.messages.some((message) => message.type === expectedType);
  }, type);

  return page.evaluate((expectedType) => {
    const index = window.__previewHarness.messages.findIndex((message) => message.type === expectedType);
    return window.__previewHarness.messages.splice(index, 1)[0];
  }, type);
}

test('preview-module handshake works when controller opens before preview', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-handshake-before';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  const hello = await waitForMessage(harness, 'hello');
  const configRequest = await waitForMessage(harness, 'config:request');

  expect(hello.source).toBe('preview');
  expect(configRequest.source).toBe('preview');

  await context.close();
});

test('preview:info response exposes explicit siteKey and scoped target scan', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-info-shape';

  await context.addInitScript(() => {
    window.__CSS_EDITOR_PREVIEW_CONFIG__ = {
      siteKey: 'client-marketing-site',
      siteName: 'Client Marketing Site',
      debug: true,
    };
  });

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await preview.evaluate(() => {
    const duplicate = document.createElement('div');
    duplicate.setAttribute('data-editable-scope', 'home.hero');
    duplicate.setAttribute('data-editable', 'home.title');
    duplicate.textContent = 'Duplicate title';
    document.body.appendChild(duplicate);

    const ignored = document.createElement('div');
    ignored.setAttribute('data-editable', 'missing.scope');
    document.body.appendChild(ignored);
  });

  await sendEditorMessage(harness, session, 'preview:info:request');
  const info = await waitForMessage(harness, 'preview:info:response');

  expect(info.site.siteKey).toBe('client-marketing-site');
  expect(info.site.siteName).toBe('Client Marketing Site');
  expect(info.editable.targets).toEqual([
    'home.hero/home.title',
    'layout.mainMenu/menu.title',
    'layout.mainMenu/menu.option',
    'layout.mainMenu/menu.subOption',
    'layout.footerMenu/menu.title',
    'layout.footerMenu/menu.option',
    'tabs.main/tabs.title',
    'tabs.main/tab.option',
    'faq.list/accordion.title',
    'faq.list/accordion.trigger',
    'filters.panel/filter.title',
    'filters.panel/filter.trigger',
    'home.subscription/home.subtitle',
    'home.subscription/form.label',
    'home.subscription/form.button',
    'home.subscription/button.primary',
    'home.features/card.title',
  ]);
  expect(info.editable.count).toBe(17);

  await context.close();
});

test('preview-module ignores editable nodes without scope', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-ignore-unscoped';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await preview.evaluate(() => {
    const ignored = document.createElement('div');
    ignored.setAttribute('data-editable', 'missing.scope');
    ignored.textContent = 'Ignored';
    document.body.appendChild(ignored);
  });

  await sendEditorMessage(harness, session, 'preview:info:request');
  const info = await waitForMessage(harness, 'preview:info:response');

  expect(info.editable.targets).not.toContain('missing.scope');

  await context.close();
});

test('preview-module keeps same target separate across different scopes', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-scoped-discovery';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await sendEditorMessage(harness, session, 'preview:info:request');

  const info = await waitForMessage(harness, 'preview:info:response');
  expect(info.editable.targets).toContain('layout.mainMenu/menu.option');
  expect(info.editable.targets).toContain('layout.footerMenu/menu.option');

  await context.close();
});

test('preview-module applies and clears full scoped config while reusing a single style tag', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-style-contract';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  const title = preview.locator('[data-editable-scope="home.hero"][data-editable="home.title"]');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'home.hero/home.title': {
        default: {
          color: '#ff0000',
          fontSize: '42px',
        },
      },
    },
  });
  await expect(title).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(title).toHaveCSS('font-size', '42px');

  const styleTagState = await preview.evaluate(() => {
    const tags = document.querySelectorAll('#live-editor-styles');
    return {
      count: tags.length,
      css: tags[0] ? tags[0].textContent : '',
    };
  });

  expect(styleTagState.count).toBe(1);
  expect(styleTagState.css).toContain('color: #ff0000 !important;');
  expect(styleTagState.css).toContain('font-size: 42px !important;');

  await sendEditorMessage(harness, session, 'config:replaceAll', { config: {} });
  const finalStyleState = await preview.locator('#live-editor-styles').textContent();
  expect(finalStyleState.trim()).toBe('');

  await context.close();
});

test('preview-module applies full scoped config without affecting other scopes', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-scoped-style-contract';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  const mainMenuTarget = 'layout.mainMenu/menu.option';
  const footerMenuTarget = 'layout.footerMenu/menu.option';
  const mainMenuOptions = preview.locator('[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]');
  const footerMenuOptions = preview.locator('[data-editable-scope="layout.footerMenu"][data-editable="menu.option"]');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      [mainMenuTarget]: {
        default: { color: '#ff0000' },
      },
      [footerMenuTarget]: {
        default: { fontSize: '30px' },
      },
    },
  });
  await expect(mainMenuOptions.first()).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(footerMenuOptions.first()).not.toHaveCSS('color', 'rgb(255, 0, 0)');

  await expect(footerMenuOptions.first()).toHaveCSS('font-size', '30px');
  await expect(mainMenuOptions.first()).not.toHaveCSS('font-size', '30px');

  await context.close();
});

test('preview-module highlights only the matching scoped target and clears it', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-scoped-highlight';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'highlight', { target: 'layout.mainMenu/menu.option' });
  await expect.poll(async () => preview.locator('[data-editable-scope="layout.mainMenu"][data-editable="menu.option"].editable-highlight').count()).toBe(3);
  await expect.poll(async () => preview.locator('[data-editable-scope="layout.footerMenu"][data-editable="menu.option"].editable-highlight').count()).toBe(0);

  await sendEditorMessage(harness, session, 'highlight', { target: null });
  await expect.poll(async () => preview.locator('.editable-highlight').count()).toBe(0);

  await context.close();
});

test('preview-module applies scoped hover styles only inside the matching scope', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-scoped-hover-stateful';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'layout.mainMenu/menu.option': {
        default: { color: '#111111' },
        hover: { color: '#ff0000' },
      },
      'layout.footerMenu/menu.option': {
        default: { color: '#111111' },
      },
    },
  });

  const mainMenuButton = preview.locator('[data-editable-scope="layout.mainMenu"][data-editable="menu.option"]').first();
  const footerMenuButton = preview.locator('[data-editable-scope="layout.footerMenu"][data-editable="menu.option"]').first();

  await mainMenuButton.hover();
  await expect(mainMenuButton).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(footerMenuButton).not.toHaveCSS('color', 'rgb(255, 0, 0)');

  await context.close();
});

test('preview-module applies selected styles to aria-selected and aria-current targets', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-selected-semantic';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'tabs.main/tab.option': {
        default: { color: '#666666' },
        selected: { color: '#111111', fontWeight: '700' },
      },
      'layout.footerMenu/menu.option': {
        default: { color: '#666666' },
        selected: { color: '#0055ff' },
      },
    },
  });

  const selectedTab = preview.locator('[data-editable-scope="tabs.main"][data-editable="tab.option"][aria-selected="true"]');
  const unselectedTab = preview.locator('[data-editable-scope="tabs.main"][data-editable="tab.option"]:not([aria-selected="true"])').first();
  const currentMenuItem = preview.locator('[data-editable-scope="layout.footerMenu"][data-editable="menu.option"][aria-current="page"]');
  const otherMenuItem = preview.locator('[data-editable-scope="layout.footerMenu"][data-editable="menu.option"]:not([aria-current="page"])').first();

  await expect(selectedTab).toHaveCSS('color', 'rgb(17, 17, 17)');
  await expect(selectedTab).toHaveCSS('font-weight', '700');
  await expect(unselectedTab).toHaveCSS('color', 'rgb(102, 102, 102)');
  await expect(currentMenuItem).toHaveCSS('color', 'rgb(0, 85, 255)');
  await expect(otherMenuItem).toHaveCSS('color', 'rgb(102, 102, 102)');

  await context.close();
});

test('preview-module applies open styles to data-state and aria-expanded targets', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-open-semantic';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'faq.list/accordion.trigger': {
        default: { color: '#222222' },
        open: { color: '#0055ff' },
      },
      'filters.panel/filter.trigger': {
        default: { color: '#222222' },
        open: { color: '#ff5500' },
      },
    },
  });

  const openAccordion = preview.locator('[data-editable-scope="faq.list"][data-editable="accordion.trigger"][data-state="open"]');
  const closedAccordion = preview.locator('[data-editable-scope="faq.list"][data-editable="accordion.trigger"]:not([data-state="open"])').first();
  const expandedFilter = preview.locator('[data-editable-scope="filters.panel"][data-editable="filter.trigger"][aria-expanded="true"]');

  await expect(openAccordion).toHaveCSS('color', 'rgb(0, 85, 255)');
  await expect(closedAccordion).toHaveCSS('color', 'rgb(34, 34, 34)');
  await expect(expandedFilter).toHaveCSS('color', 'rgb(255, 85, 0)');

  await context.close();
});

test('preview-module returns computed styles for a scoped target on request', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-computed-styles';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'target:computedStyles:request', {
    target: 'home.hero/home.title',
    properties: ['color', 'fontSize', 'lineHeight'],
  });

  const response = await waitForMessage(harness, 'target:computedStyles:response');
  expect(response.target).toBe('home.hero/home.title');
  expect(response.styles.color).toMatch(/^rgb\(/);
  expect(response.styles.fontSize).toBeTruthy();
  expect(response.styles.lineHeight).toBeTruthy();

  await context.close();
});
