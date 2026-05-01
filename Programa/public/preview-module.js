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
    const normalizedScope = normalizePart(scope);
    const normalizedTarget = normalizePart(target);
    if (!normalizedScope || !normalizedTarget) return null;
    if (normalizedScope.includes('/') || normalizedTarget.includes('/')) return null;

    return `${normalizedScope}/${normalizedTarget}`;
  };

  const parseCanonicalKey = (key) => {
    const normalizedKey = normalizePart(key);
    if (!normalizedKey) return null;

    const parts = normalizedKey.split('/');
    if (parts.length !== 2) return null;

    const scope = normalizePart(parts[0]);
    const target = normalizePart(parts[1]);
    if (!scope || !target) return null;

    return {
      scope,
      target,
      canonicalKey: `${scope}/${target}`
    };
  };

  const selectorForKey = (key) => {
    const parsed = parseCanonicalKey(key);
    if (!parsed) return null;

    const escapedScope = CSS.escape(parsed.scope);
    const escapedTarget = CSS.escape(parsed.target);
    return `[data-editable-scope="${escapedScope}"][data-editable="${escapedTarget}"]`;
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

  const isStatefulStyleSet = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if (keys.length === 0 || !keys.includes('default')) return false;
    return keys.every((key) => RUNTIME_STATES.includes(key) && value[key] && typeof value[key] === 'object' && !Array.isArray(value[key]));
  };

  const createEmptyStatefulStyleSet = () => ({
    default: {}
  });

  const normalizeStatefulEntry = (value) => {
    if (!isStatefulStyleSet(value)) {
      return createEmptyStatefulStyleSet();
    }

    const normalized = createEmptyStatefulStyleSet();
    RUNTIME_STATES.forEach((state) => {
      if (value[state] && typeof value[state] === 'object' && !Array.isArray(value[state])) {
        normalized[state] = { ...value[state] };
      }
    });

    return normalized;
  };

  const getElementKey = (element) => {
    const target = normalizePart(element.getAttribute('data-editable'));
    if (!target) return null;
    const scope = normalizePart(element.getAttribute('data-editable-scope'));

    if (!scope) {
      warnLog('Ignored data-editable element without required data-editable-scope', element);
      return null;
    }

    const key = buildCanonicalKey(scope, target);
    if (!key) {
      warnLog('Ignored malformed editable target key', { scope, target });
    }
    return key;
  };

  const normalizeConfig = (config) => {
    if (!config || typeof config !== 'object' || Array.isArray(config)) return {};

    const normalized = {};
    Object.entries(config).forEach(([target, styles]) => {
      if (!parseCanonicalKey(target)) {
        warnLog('Ignored malformed config target key', target);
        return;
      }
      if (!isStatefulStyleSet(styles)) {
        warnLog('Ignored non-stateful config target', target);
        return;
      }

      normalized[target] = normalizeStatefulEntry(styles);
    });

    return normalized;
  };

  const getComputedStylesForTarget = (target, properties) => {
    if (!Array.isArray(properties) || properties.length === 0) {
      return {};
    }

    const selector = selectorForKey(target);
    if (!selector) {
      return {};
    }

    const element = document.querySelector(selector);
    if (!element) {
      return {};
    }

    const computed = window.getComputedStyle(element);
    const result = {};

    properties.forEach((property) => {
      if (typeof property !== 'string' || !property) {
        return;
      }

      const cssName = camelToKebab(property);
      const value = computed.getPropertyValue(cssName);
      if (typeof value === 'string') {
        const normalizedValue = value.trim();
        if (normalizedValue) {
          result[property] = normalizedValue;
        }
      }
    });

    return result;
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

      const normalized = normalizeStatefulEntry(styles);
      const hasAnyStyles = RUNTIME_STATES.some((state) => {
        const stateStyles = normalized[state];
        return stateStyles && Object.keys(stateStyles).length > 0;
      });

      if (!hasAnyStyles) {
        delete styleConfig[target];
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
      const preferredOrigin = openerOrigin || '*';
      try {
        openerWindow.postMessage(message, preferredOrigin);
      } catch (error) {
        warnLog('postMessage failed with preferred origin, retrying with wildcard', {
          type,
          preferredOrigin,
          error: error instanceof Error ? error.message : String(error),
        });

        try {
          openerWindow.postMessage(message, '*');
        } catch (retryError) {
          warnLog('postMessage retry failed', {
            type,
            error: retryError instanceof Error ? retryError.message : String(retryError),
          });
          return;
        }
      }
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
        styleConfig = normalizeConfig(msg.config);
        removeEmptyTargets();
        applyStyles();
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

      case 'target:computedStyles:request':
        if (!msg.target || !parseCanonicalKey(msg.target)) {
          return;
        }

        send('target:computedStyles:response', {
          target: msg.target,
          styles: getComputedStylesForTarget(msg.target, msg.properties)
        });
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
