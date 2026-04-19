import { renderStyles, upsertLiveStyleTag } from '../shared/css';
import { createBaseMessage, type ProtocolMessage } from '../shared/messages';
import type { StyleConfig } from '../shared/style-schema';
import { BroadcastChannelTransport } from '../transport/broadcast-channel';

function getSessionId(): string {
  const params = new URLSearchParams(window.location.search);
  const existing = params.get('session');

  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  params.set('session', sessionId);
  history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  return sessionId;
}

const sessionId = getSessionId();
const transport = new BroadcastChannelTransport(sessionId);
let config: StyleConfig = {};

function applyHighlight(target: string | null): void {
  document
    .querySelectorAll('[data-editable]')
    .forEach((el) => el.classList.remove('editable-highlight'));

  if (!target) return;

  document
    .querySelectorAll(`[data-editable="${target}"]`)
    .forEach((el) => el.classList.add('editable-highlight'));
}

function rerender(): void {
  const css = renderStyles(config);
  upsertLiveStyleTag(css);
}

transport.subscribe((message: ProtocolMessage) => {
  if (message.sessionId !== sessionId || message.source === 'preview') return;

  if (message.type === 'config:replaceAll') {
    config = message.config;
    rerender();
  }

  if (message.type === 'style:update') {
    config = {
      ...config,
      [message.target]: {
        ...config[message.target],
        ...message.styles,
      },
    };
    rerender();
  }

  if (message.type === 'style:remove') {
    const current = { ...(config[message.target] ?? {}) };
    for (const key of message.keys) {
      delete current[key];
    }
    config = {
      ...config,
      [message.target]: current,
    };
    rerender();
  }

  if (message.type === 'highlight') {
    applyHighlight(message.target);
  }
});

transport.send({
  ...createBaseMessage('ready', sessionId, 'preview'),
  type: 'ready',
});

transport.send({
  ...createBaseMessage('config:request', sessionId, 'preview'),
  type: 'config:request',
});

const button = document.getElementById('open-editor');
button?.addEventListener('click', () => {
  window.open(`../editor/index.html?session=${sessionId}`, 'editor-window');
});
