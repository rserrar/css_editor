import type { ProtocolMessage } from '../shared/messages';

export interface Transport {
  send(message: ProtocolMessage): void;
  subscribe(handler: (message: ProtocolMessage) => void): () => void;
  close(): void;
}

export class BroadcastChannelTransport implements Transport {
  private readonly channel: BroadcastChannel;

  constructor(sessionId: string) {
    this.channel = new BroadcastChannel(`style-editor:${sessionId}`);
  }

  send(message: ProtocolMessage): void {
    this.channel.postMessage(message);
  }

  subscribe(handler: (message: ProtocolMessage) => void): () => void {
    const listener = (event: MessageEvent<ProtocolMessage>) => handler(event.data);
    this.channel.addEventListener('message', listener);

    return () => {
      this.channel.removeEventListener('message', listener);
    };
  }

  close(): void {
    this.channel.close();
  }
}
