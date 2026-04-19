import { ProtocolMessage } from '../../domain/models';
import { Transport } from './Transport';

type WindowGetter = () => Window | null;
type OriginGetter = () => string | null;

export class PostMessageTransport implements Transport {
  constructor(
    private sessionId: string,
    private getTargetWindow: WindowGetter,
    private getTargetOrigin: OriginGetter,
  ) {}

  send(message: ProtocolMessage): void {
    const targetWindow = this.getTargetWindow();
    if (!targetWindow || targetWindow.closed) return;

    const targetOrigin = this.getTargetOrigin() || '*';
    try {
      targetWindow.postMessage(message, targetOrigin);
    } catch {
      // Ignore transient cross-origin timing errors while a preview window is still navigating.
    }
  }

  subscribe(handler: (message: ProtocolMessage) => void): () => void {
    const listener = (event: MessageEvent<ProtocolMessage>) => {
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      if (message.sessionId !== this.sessionId) return;

      const allowedOrigin = this.getTargetOrigin();
      if (allowedOrigin && event.origin !== allowedOrigin) return;

      handler(message);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }

  close(): void {}
}
