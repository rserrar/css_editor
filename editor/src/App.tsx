import { useEffect, useMemo, useState } from 'react';
import { BroadcastChannelTransport } from '../../transport/broadcast-channel';
import { createBaseMessage, type ProtocolMessage } from '../../shared/messages';
import { sanitizeStyleSet, type EditableStyleSet, type StyleConfig } from '../../shared/style-schema';
import { ConnectionStatus } from './components/ConnectionStatus';
import { TargetSelector } from './components/TargetSelector';
import { StylePanel } from './components/StylePanel';

const DEFAULT_TARGETS = [
  'contacto.title',
  'contacto.form.label',
  'contacto.form.input',
  'contacto.form.buttonPrimary',
];

function getSessionId(): string {
  const params = new URLSearchParams(window.location.search);
  const existing = params.get('session');

  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  params.set('session', sessionId);
  history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  return sessionId;
}

export function App() {
  const [sessionId] = useState<string>(() => getSessionId());
  const [config, setConfig] = useState<StyleConfig>({});
  const [selectedTarget, setSelectedTarget] = useState<string | null>(DEFAULT_TARGETS[0]);
  const [isPreviewConnected, setIsPreviewConnected] = useState(false);

  const transport = useMemo(() => new BroadcastChannelTransport(sessionId), [sessionId]);

  useEffect(() => {
    const unsubscribe = transport.subscribe((message: ProtocolMessage) => {
      if (message.sessionId !== sessionId || message.source === 'editor') return;

      if (message.type === 'ready') {
        setIsPreviewConnected(true);
        transport.send({
          ...createBaseMessage('config:replaceAll', sessionId, 'editor'),
          type: 'config:replaceAll',
          config,
        });
      }

      if (message.type === 'config:request') {
        transport.send({
          ...createBaseMessage('config:replaceAll', sessionId, 'editor'),
          type: 'config:replaceAll',
          config,
        });
      }
    });

    transport.send({
      ...createBaseMessage('ready', sessionId, 'editor'),
      type: 'ready',
    });

    return () => {
      unsubscribe();
      transport.close();
    };
  }, [config, sessionId, transport]);

  function updateStyles(target: string, styles: EditableStyleSet) {
    const sanitized = sanitizeStyleSet(styles as Record<string, string>);

    setConfig((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        ...sanitized,
      },
    }));

    transport.send({
      ...createBaseMessage('style:update', sessionId, 'editor'),
      type: 'style:update',
      target,
      styles: sanitized,
    });
  }

  function openPreview() {
    window.open(`../preview/index.html?session=${sessionId}`, 'preview-window');
  }

  useEffect(() => {
    if (!selectedTarget) return;

    transport.send({
      ...createBaseMessage('highlight', sessionId, 'editor'),
      type: 'highlight',
      target: selectedTarget,
    });
  }, [selectedTarget, sessionId, transport]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>CSS Visual Editor</h1>
          <p>Sessió: {sessionId}</p>
        </div>
        <div className="app-actions">
          <ConnectionStatus connected={isPreviewConnected} />
          <button onClick={openPreview}>Obrir preview</button>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <TargetSelector
            targets={DEFAULT_TARGETS}
            selected={selectedTarget}
            onSelect={setSelectedTarget}
          />
        </aside>

        <section className="content">
          <StylePanel
            target={selectedTarget}
            values={selectedTarget ? config[selectedTarget] ?? {} : {}}
            onChange={(styles) => {
              if (!selectedTarget) return;
              updateStyles(selectedTarget, styles);
            }}
          />

          <section className="json-panel">
            <h2>Config JSON</h2>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </section>
        </section>
      </main>
    </div>
  );
}
