const { test, expect } = require('playwright/test');

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

test('preview-module communicates with opener via postMessage', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-postmessage-opener';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);

  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  const hello = await waitForMessage(harness, 'hello');
  expect(hello.source).toBe('preview');

  await sendEditorMessage(harness, session, 'preview:info:request');
  const info = await waitForMessage(harness, 'preview:info:response');
  expect(info.editable.targets).toContain('home.title');

  await sendEditorMessage(harness, session, 'style:update', { target: 'home.title', styles: { color: '#ff0000' } });
  await expect(preview.locator('[data-editable="home.title"]')).toHaveCSS('color', 'rgb(255, 0, 0)');

  await context.close();
});

test('preview:info response exposes explicit siteKey and coherent target scan', async ({ browser }) => {
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
    duplicate.setAttribute('data-editable', 'home.title');
    duplicate.textContent = 'Duplicate title';
    document.body.appendChild(duplicate);

    const empty = document.createElement('div');
    empty.setAttribute('data-editable', '');
    document.body.appendChild(empty);
  });

  await sendEditorMessage(harness, session, 'preview:info:request');

  const info = await waitForMessage(harness, 'preview:info:response');

  expect(info.protocolVersion).toBe(1);
  expect(info.moduleVersion).toBe('1.0.0');
  expect(info.page.url).toContain(`/example-web.html?session=${session}`);
  expect(info.page.origin).toBe('http://127.0.0.1:3000');
  expect(info.page.title).toBe('Exemple Web Real (Preview)');
  expect(info.site.siteKey).toBe('client-marketing-site');
  expect(info.site.siteName).toBe('Client Marketing Site');
  expect(info.editable.targets).toEqual([
    'home.title',
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
    'home.subtitle',
    'form.label',
    'form.button',
    'button.primary',
    'home.features/card.title',
  ]);
  expect(info.editable.count).toBe(17);

  await context.close();
});

test('preview-module keeps legacy discovery without scope', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-legacy-discovery';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await sendEditorMessage(harness, session, 'preview:info:request');

  const info = await waitForMessage(harness, 'preview:info:response');
  expect(info.editable.targets).toContain('home.title');
  expect(info.editable.targets).toContain('form.label');
  expect(info.editable.targets).not.toContain('/home.title');

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

test('preview-module applies and removes styles while reusing a single style tag', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-style-contract';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'style:update', { target: 'home.title', styles: { color: '#ff0000' } });
  await expect(preview.locator('[data-editable="home.title"]')).toHaveCSS('color', 'rgb(255, 0, 0)');

  await sendEditorMessage(harness, session, 'style:update', { target: 'home.title', styles: { fontSize: '42px' } });
  await expect(preview.locator('[data-editable="home.title"]')).toHaveCSS('font-size', '42px');

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

  await sendEditorMessage(harness, session, 'style:remove', { target: 'home.title', keys: ['color'] });
  await expect(preview.locator('[data-editable="home.title"]')).not.toHaveCSS('color', 'rgb(255, 0, 0)');

  const cssAfterColorRemoval = await preview.locator('#live-editor-styles').textContent();
  expect(cssAfterColorRemoval).not.toContain('color: #ff0000 !important;');
  expect(cssAfterColorRemoval).toContain('font-size: 42px !important;');

  await sendEditorMessage(harness, session, 'style:remove', { target: 'home.title', keys: ['fontSize'] });

  const finalStyleState = await preview.evaluate(() => {
    const tags = document.querySelectorAll('#live-editor-styles');
    return {
      count: tags.length,
      css: tags[0] ? tags[0].textContent : '',
    };
  });

  expect(finalStyleState.count).toBe(1);
  expect(finalStyleState.css.trim()).toBe('');

  await context.close();
});

test('preview-module applies and removes scoped styles without affecting other scopes', async ({ browser }) => {
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
  const mainMenuOptions = preview.locator('[data-editable-scope="layout.mainMenu"] [data-editable="menu.option"]');
  const footerMenuOptions = preview.locator('[data-editable-scope="layout.footerMenu"] [data-editable="menu.option"]');

  await sendEditorMessage(harness, session, 'style:update', { target: mainMenuTarget, styles: { color: '#ff0000' } });
  await expect(mainMenuOptions.first()).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(footerMenuOptions.first()).not.toHaveCSS('color', 'rgb(255, 0, 0)');

  await sendEditorMessage(harness, session, 'style:update', { target: footerMenuTarget, styles: { fontSize: '30px' } });
  await expect(footerMenuOptions.first()).toHaveCSS('font-size', '30px');
  await expect(mainMenuOptions.first()).not.toHaveCSS('font-size', '30px');

  await sendEditorMessage(harness, session, 'style:remove', { target: mainMenuTarget, keys: ['color'] });
  await expect(mainMenuOptions.first()).not.toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(footerMenuOptions.first()).toHaveCSS('font-size', '30px');

  await context.close();
});

test('preview-module highlights all matching targets and clears them', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-highlight-contract';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await preview.evaluate(() => {
    const duplicate = document.createElement('div');
    duplicate.setAttribute('data-editable', 'home.title');
    duplicate.textContent = 'Duplicated title';
    document.body.appendChild(duplicate);
  });

  await sendEditorMessage(harness, session, 'highlight', { target: 'home.title' });
  await expect.poll(async () => preview.locator('.editable-highlight').count()).toBe(2);

  await sendEditorMessage(harness, session, 'highlight', { target: null });
  await expect.poll(async () => preview.locator('.editable-highlight').count()).toBe(0);

  await context.close();
});

test('preview-module highlights only the matching scoped target and keeps count coherent', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-scoped-highlight';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'highlight', { target: 'layout.mainMenu/menu.option' });
  await expect.poll(async () => preview.locator('[data-editable-scope="layout.mainMenu"] .editable-highlight').count()).toBe(3);
  await expect.poll(async () => preview.locator('[data-editable-scope="layout.footerMenu"] .editable-highlight').count()).toBe(0);

  await sendEditorMessage(harness, session, 'highlight', { target: null });
  await expect.poll(async () => preview.locator('.editable-highlight').count()).toBe(0);

  await context.close();
});

test('preview-module keeps legacy config working exactly as before', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-legacy-stateful-backcompat';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'home.title': {
        color: '#ff0000',
      },
    },
  });

  await expect(preview.locator('[data-editable="home.title"]')).toHaveCSS('color', 'rgb(255, 0, 0)');

  await context.close();
});

test('preview-module applies hover styles only during hover for stateful config', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-hover-stateful';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'button.primary': {
        default: { backgroundColor: '#000000' },
        hover: { backgroundColor: '#ff0000' },
      },
    },
  });

  const button = preview.locator('[data-editable="button.primary"]');
  await expect(button).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(255, 0, 0)');

  await context.close();
});

test('preview-module applies focus styles for stateful config', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-focus-stateful';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'button.primary': {
        default: { borderColor: '#000000' },
        focus: { borderColor: '#0000ff' },
      },
    },
  });

  const button = preview.locator('[data-editable="button.primary"]');
  await expect(button).toHaveCSS('border-top-color', 'rgb(0, 0, 0)');
  await button.focus();
  await expect(button).toHaveCSS('border-top-color', 'rgb(0, 0, 255)');

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

  const mainMenuButton = preview.locator('[data-editable-scope="layout.mainMenu"] [data-editable="menu.option"]').first();
  const footerMenuButton = preview.locator('[data-editable-scope="layout.footerMenu"] [data-editable="menu.option"]').first();

  await mainMenuButton.hover();
  await expect(mainMenuButton).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(footerMenuButton).not.toHaveCSS('color', 'rgb(255, 0, 0)');

  await context.close();
});

test('preview-module keeps multiple css states independent', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const session = 'preview-combined-css-states';

  const harness = await context.newPage();
  await setupOpenerHarness(harness);
  const popupPromise = context.waitForEvent('page');
  await openPreviewFromHarness(harness, session);
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'button.primary': {
        default: { backgroundColor: '#000000', borderColor: '#000000' },
        hover: { backgroundColor: '#ff0000' },
        focus: { borderColor: '#0000ff' },
      },
    },
  });

  const button = preview.locator('[data-editable="button.primary"]');
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(button).toHaveCSS('border-top-color', 'rgb(0, 0, 0)');

  await button.focus();
  await expect(button).toHaveCSS('border-top-color', 'rgb(0, 0, 255)');

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

  const selectedTab = preview.locator('[data-editable-scope="tabs.main"] [data-editable="tab.option"][aria-selected="true"]');
  const unselectedTab = preview.locator('[data-editable-scope="tabs.main"] [data-editable="tab.option"]:not([aria-selected="true"])').first();
  const currentMenuItem = preview.locator('[data-editable-scope="layout.footerMenu"] [data-editable="menu.option"][aria-current="page"]');
  const otherMenuItem = preview.locator('[data-editable-scope="layout.footerMenu"] [data-editable="menu.option"]:not([aria-current="page"])').first();

  await expect(selectedTab).toHaveCSS('color', 'rgb(17, 17, 17)');
  await expect(selectedTab).toHaveCSS('font-weight', '700');
  await expect(unselectedTab).toHaveCSS('color', 'rgb(102, 102, 102)');
  await expect(currentMenuItem).toHaveCSS('color', 'rgb(0, 85, 255)');
  await expect(otherMenuItem).toHaveCSS('color', 'rgb(102, 102, 102)');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'tabs.main/tab.option': {
        default: { color: '#666666' },
      },
    },
  });

  await expect(selectedTab).toHaveCSS('color', 'rgb(102, 102, 102)');

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

  const openAccordion = preview.locator('[data-editable-scope="faq.list"] [data-editable="accordion.trigger"][data-state="open"]');
  const closedAccordion = preview.locator('[data-editable-scope="faq.list"] [data-editable="accordion.trigger"]:not([data-state="open"])').first();
  const expandedFilter = preview.locator('[data-editable-scope="filters.panel"] [data-editable="filter.trigger"][aria-expanded="true"]');

  await expect(openAccordion).toHaveCSS('color', 'rgb(0, 85, 255)');
  await expect(closedAccordion).toHaveCSS('color', 'rgb(34, 34, 34)');
  await expect(expandedFilter).toHaveCSS('color', 'rgb(255, 85, 0)');

  await sendEditorMessage(harness, session, 'config:replaceAll', {
    config: {
      'faq.list/accordion.trigger': {
        default: { color: '#222222' },
      },
    },
  });

  await expect(openAccordion).toHaveCSS('color', 'rgb(34, 34, 34)');

  await context.close();
});
