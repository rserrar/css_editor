
/**
 * LiveStyle Preview Module v1.0.0
 * Mòdul autònom per a la integració d'edició visual CSS.
 */
(function() {
  const CONFIG = {
    styleTagId: 'live-editor-styles',
    highlightClass: 'editable-highlight',
    protocolVersion: 1,
    moduleVersion: '1.0.0'
  };

  // --- Estat Intern ---
  let sessionId = null;
  let channel = null;
  let styleConfig = {};

  // --- Utilitats ---
  const getSessionId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
  };

  const camelToKebab = (str) => {
    return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  };

  // --- Motor de Renderització CSS ---
  const applyStyles = () => {
    let css = '';
    for (const [target, styles] of Object.entries(styleConfig)) {
      const declarations = Object.entries(styles)
        .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val} !important;`)
        .join('\n');
      
      if (declarations) {
        css += `[data-editable="${target}"] {\n${declarations}\n}\n\n`;
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

  // --- Escàner del DOM ---
  const scanTargets = () => {
    const elements = document.querySelectorAll('[data-editable]');
    const targets = new Set();
    elements.forEach(el => targets.add(el.getAttribute('data-editable')));
    return Array.from(targets);
  };

  // --- Gestió de Missatges ---
  const send = (type, payload = {}) => {
    if (!channel) return;
    channel.postMessage({
      ...payload,
      type,
      sessionId,
      source: 'preview',
      timestamp: Date.now()
    });
  };

  const handleMessage = (msg) => {
    if (msg.sessionId !== sessionId || msg.source === 'preview') return;

    switch (msg.type) {
      case 'preview:info:request':
        const targets = scanTargets();
        send('preview:info:response', {
          protocolVersion: CONFIG.protocolVersion,
          moduleVersion: CONFIG.moduleVersion,
          page: {
            url: window.location.href,
            origin: window.location.origin,
            title: document.title
          },
          site: {
            siteKey: window.location.hostname.replace(/\./g, '-'),
            siteName: document.title
          },
          editable: {
            targets: targets,
            count: targets.length
          }
        });
        break;

      case 'config:replaceAll':
        styleConfig = msg.config || {};
        applyStyles();
        break;

      case 'style:update':
        styleConfig[msg.target] = {
          ...(styleConfig[msg.target] || {}),
          ...msg.styles
        };
        applyStyles();
        break;

      case 'style:remove':
        if (styleConfig[msg.target]) {
          msg.keys.forEach(key => delete styleConfig[msg.target][key]);
          applyStyles();
        }
        break;

      case 'highlight':
        document.querySelectorAll('[data-editable]').forEach(el => {
          el.classList.remove(CONFIG.highlightClass);
        });
        if (msg.target) {
          const elements = document.querySelectorAll(`[data-editable="${msg.target}"]`);
          elements.forEach(el => el.classList.add(CONFIG.highlightClass));
        }
        break;
    }
  };

  // --- Inicialització ---
  const init = () => {
    sessionId = getSessionId();
    if (!sessionId) {
      console.warn('LiveStyle: No s\'ha trobat "session" a la URL. El mòdul preview no s\'activarà.');
      return;
    }

    // Injectar estils base per al highlight
    const baseStyle = document.createElement('style');
    baseStyle.textContent = `
      .${CONFIG.highlightClass} {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        transition: outline 0.2s ease-in-out !important;
      }
    `;
    document.head.appendChild(baseStyle);

    // Configurar canal
    channel = new BroadcastChannel(`style-editor:${sessionId}`);
    channel.addEventListener('message', (event) => handleMessage(event.data));

    // Handshake inicial
    send('hello');
    
    // Demanar configuració inicial per si l'editor ja està obert
    send('config:request');

    console.log(`LiveStyle Preview Module v${CONFIG.moduleVersion} actiu per a la sessió: ${sessionId}`);
  };

  // Executar quan el DOM estigui lliure
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
