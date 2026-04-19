/**
 * LiveStyle Preview Module v1.0.0
 * Modul autonom per a la integracio d'edicio visual CSS.
 */
(function() {
  const currentScript = document.currentScript;
  const CONFIG = {
    styleTagId: 'live-editor-styles',
    highlightClass: 'editable-highlight',
    protocolVersion: 1,
    moduleVersion: '1.0.0'
  };
  const RUNTIME_STATES = ['default', 'hover', 'focus', 'active', 'disabled', 'selected', 'open'];
  const SEMANTIC_STATE_SELECTORS = {
    selected: ['[aria-selected="true"]', '[aria-current="page"]'],
    open: ['[data-state="open"]', '[aria-expanded="true"]']
  };

  let sessionId = null;
  let openerWindow = null;
  let openerOrigin = null;
  let styleConfig = {};
  let runtimeConfig = {
    siteKey: '',
    siteName: '',
    debug: false
  };

  const readBoolean = (value) => {
    return value === true || value === 'true' || value === '1';
  };

  const resolveRuntimeConfig = () => {
    const globalConfig = window.__CSS_EDITOR_PREVIEW_CONFIG__ || {};
    const data = currentScript && currentScript.dataset ? currentScript.dataset : {};

    return {
      siteKey: globalConfig.siteKey || window.__CSS_EDITOR_SITE_KEY__ || data.siteKey || '',
      siteName: globalConfig.siteName || data.siteName || '',
      debug: readBoolean(globalConfig.debug) || readBoolean(data.debug)
    };
  };

  const debugLog = (...args) => {
    if (runtimeConfig.debug) {
      console.debug('[LiveStyle preview]', ...args);
    }
  };

  const warnLog = (...args) => {
    console.warn('[LiveStyle preview]', ...args);
  };

  const getSessionId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
  };

  const getReferrerOrigin = () => {
    try {
      return document.referrer ? new URL(document.referrer).origin : null;
    } catch {
      return null;
    }
  };

  const camelToKebab = (str) => {
    return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  };

  const normalizePart = (value) => {
    return typeof value === 'string' ? value.trim() : '';
  };

  const buildCanonicalKey = (scope, target) => {
    const normalizedTarget = normalizePart(target);
    if (!normalizedTarget) return null;

    const normalizedScope = normalizePart(scope);
    return normalizedScope ? `${normalizedScope}/${normalizedTarget}` : normalizedTarget;
  };

  const parseCanonicalKey = (key) => {
    const normalizedKey = normalizePart(key);
    if (!normalizedKey) return null;

    const separatorIndex = normalizedKey.indexOf('/');
    if (separatorIndex === -1) {
      return {
        scope: null,
        target: normalizedKey,
        canonicalKey: normalizedKey,
        hasScope: false
      };
    }

    const scope = normalizePart(normalizedKey.slice(0, separatorIndex));
    const target = normalizePart(normalizedKey.slice(separatorIndex + 1));
    if (!scope || !target) return null;

    return {
      scope,
      target,
      canonicalKey: `${scope}/${target}`,
      hasScope: true
    };
  };

  const selectorForKey = (key) => {
    const parsed = parseCanonicalKey(key);
    if (!parsed) return null;

    const escapedTarget = CSS.escape(parsed.target);
    if (!parsed.hasScope) {
      return `[data-editable="${escapedTarget}"]`;
    }

    const escapedScope = CSS.escape(parsed.scope);
    return `[data-editable-scope="${escapedScope}"] [data-editable="${escapedTarget}"], [data-editable-scope="${escapedScope}"][data-editable="${escapedTarget}"]`;
  };

  const selectorForState = (key, state) => {
    const baseSelector = selectorForKey(key);
    if (!baseSelector) return null;
    if (state === 'default') return baseSelector;

    if (SEMANTIC_STATE_SELECTORS[state]) {
      return baseSelector
        .split(',')
        .flatMap((selector) => {
          const trimmed = selector.trim();
          return SEMANTIC_STATE_SELECTORS[state].map((suffix) => `${trimmed}${suffix}`);
        })
        .join(', ');
    }

    return baseSelector
      .split(',')
      .map((selector) => `${selector.trim()}:${state}`)
      .join(', ');
  };

  const isPlainStyleSet = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.keys(value).every((key) => !RUNTIME_STATES.includes(key));
  };

  const isStatefulStyleSet = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if (keys.length === 0) return false;
    return keys.every((key) => RUNTIME_STATES.includes(key));
  };

  const normalizeStatefulEntry = (value) => {
    if (isStatefulStyleSet(value)) {
      return { ...value };
    }
    if (isPlainStyleSet(value)) {
      return { default: { ...value } };
    }
    return {};
  };

  const mergeDefaultState = (value, styles) => {
    if (isStatefulStyleSet(value)) {
      return {
        ...value,
        default: {
          ...(value.default || {}),
          ...styles,
        },
      };
    }

    return {
      ...(isPlainStyleSet(value) ? value : {}),
      ...styles,
    };
  };

  const removeDefaultStateKeys = (value, keys) => {
    if (isStatefulStyleSet(value)) {
      const nextDefault = { ...(value.default || {}) };
      keys.forEach((key) => delete nextDefault[key]);
      return {
        ...value,
        default: nextDefault,
      };
    }

    const next = { ...(isPlainStyleSet(value) ? value : {}) };
    keys.forEach((key) => delete next[key]);
    return next;
  };

  const getElementKey = (element) => {
    const target = normalizePart(element.getAttribute('data-editable'));
    if (!target) return null;
    const scope = normalizePart(element.getAttribute('data-editable-scope'));

    if (scope) {
      return buildCanonicalKey(scope, target);
    }

    const scopedParent = element.closest('[data-editable-scope]');
    const inheritedScope = scopedParent ? normalizePart(scopedParent.getAttribute('data-editable-scope')) : '';
    return buildCanonicalKey(inheritedScope, target);
  };

  const applyStyles = () => {
    let css = '';
    for (const [target, styles] of Object.entries(styleConfig)) {
      const statefulStyles = normalizeStatefulEntry(styles);

      for (const state of RUNTIME_STATES) {
        const stateStyles = statefulStyles[state];
        const selector = selectorForState(target, state);
        const declarations = Object.entries(stateStyles || {})
          .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val} !important;`)
          .join('\n');

        if (declarations && selector) {
          css += `${selector} {\n${declarations}\n}\n\n`;
        }
      }
    }

    let styleEl = document.getElementById(CONFIG.styleTagId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = CONFIG.styleTagId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  };

  const removeEmptyTargets = () => {
    for (const [target, styles] of Object.entries(styleConfig)) {
      if (!styles || typeof styles !== 'object' || Object.keys(styles).length === 0) {
        delete styleConfig[target];
        continue;
      }

      if (isStatefulStyleSet(styles)) {
        const hasAnyStyles = RUNTIME_STATES.some((state) => {
          const stateStyles = styles[state];
          return stateStyles && Object.keys(stateStyles).length > 0;
        });

        if (!hasAnyStyles) {
          delete styleConfig[target];
        }
      }
    }
  };

  const scanTargets = () => {
    const elements = document.querySelectorAll('[data-editable]');
    const targets = new Set();
    elements.forEach(el => {
      const targetKey = getElementKey(el);
      if (targetKey) {
        targets.add(targetKey);
      }
    });
    return Array.from(targets);
  };

  const announcePresence = () => {
    debugLog('Announcing presence for session', sessionId);
    send('hello');
    send('config:request');
  };

  const send = (type, payload = {}) => {
    const message = {
      ...payload,
      type,
      sessionId,
      source: 'preview',
      timestamp: Date.now()
    };

    if (openerWindow && !openerWindow.closed) {
      openerWindow.postMessage(message, openerOrigin || '*');
    } else {
      warnLog('Cannot send message before opener transport init', type);
      return;
    }

    debugLog('Sending message', type, payload);
  };

  const handleMessage = (msg) => {
    if (msg.sessionId !== sessionId || msg.source === 'preview') return;

    debugLog('Received message', msg.type, msg);

    switch (msg.type) {
      case 'preview:info:request':
        const targets = scanTargets();
        if (targets.length === 0) {
          warnLog('No editable targets detected on the page');
        }

        send('preview:info:response', {
          protocolVersion: CONFIG.protocolVersion,
          moduleVersion: CONFIG.moduleVersion,
          page: {
            url: window.location.href,
            origin: window.location.origin,
            title: document.title
          },
          site: {
            siteKey: runtimeConfig.siteKey || window.location.hostname.replace(/\./g, '-'),
            siteName: runtimeConfig.siteName || document.title
          },
          editable: {
            targets: targets,
            count: targets.length
          }
        });
        break;

      case 'config:replaceAll':
        styleConfig = msg.config && typeof msg.config === 'object' ? { ...msg.config } : {};
        removeEmptyTargets();
        applyStyles();
        break;

      case 'style:update':
        styleConfig[msg.target] = mergeDefaultState(styleConfig[msg.target], msg.styles);
        applyStyles();
        break;

      case 'style:remove':
        if (styleConfig[msg.target]) {
          styleConfig[msg.target] = removeDefaultStateKeys(styleConfig[msg.target], msg.keys);
          if (!styleConfig[msg.target] || Object.keys(styleConfig[msg.target]).length === 0) {
            delete styleConfig[msg.target];
          }
          applyStyles();
        }
        break;

      case 'hello':
        announcePresence();
        break;

      case 'highlight':
        document.querySelectorAll('[data-editable]').forEach(el => {
          el.classList.remove(CONFIG.highlightClass);
        });
        if (msg.target) {
          const selector = selectorForKey(msg.target);
          const elements = selector ? document.querySelectorAll(selector) : [];
          elements.forEach(el => el.classList.add(CONFIG.highlightClass));
        }
        break;
    }
  };

  const init = () => {
    runtimeConfig = resolveRuntimeConfig();
    sessionId = getSessionId();
    if (!sessionId) {
      warnLog('No s\'ha trobat "session" a la URL. El modul preview no s\'activara.');
      return;
    }

    openerWindow = window.opener && !window.opener.closed ? window.opener : null;
    openerOrigin = getReferrerOrigin();

    const baseStyle = document.createElement('style');
    baseStyle.textContent = `
      .${CONFIG.highlightClass} {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        transition: outline 0.2s ease-in-out !important;
      }
    `;
    document.head.appendChild(baseStyle);

    window.addEventListener('message', (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (!openerWindow || event.source !== openerWindow) return;
      if (event.data.sessionId !== sessionId) return;

      if (event.origin) {
        openerOrigin = event.origin;
      }

      handleMessage(event.data);
    });

    const initialTargets = scanTargets();
    if (initialTargets.length === 0) {
      warnLog('No editable targets detected on init');
    }
    debugLog('Preview module ready', {
      sessionId,
      siteKey: runtimeConfig.siteKey || window.location.hostname.replace(/\./g, '-'),
      targetCount: initialTargets.length,
      debug: runtimeConfig.debug,
      openerOrigin
    });

    announcePresence();
    window.setTimeout(announcePresence, 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
