import { ProtocolMessage } from '../../domain/models';

export interface Transport {
  send(message: ProtocolMessage): void;
  subscribe(handler: (message: ProtocolMessage) => void): () => void;
  close(): void;
}
