import type { EditableStyleSet, StyleConfig, AllowedStyleKey } from './style-schema';

export type MessageSource = 'editor' | 'preview';

export type BaseMessage = {
  type: string;
  sessionId: string;
  source: MessageSource;
  timestamp: number;
};

export type ReadyMessage = BaseMessage & {
  type: 'ready';
};

export type ConfigRequestMessage = BaseMessage & {
  type: 'config:request';
};

export type ConfigReplaceAllMessage = BaseMessage & {
  type: 'config:replaceAll';
  config: StyleConfig;
};

export type StyleUpdateMessage = BaseMessage & {
  type: 'style:update';
  target: string;
  styles: EditableStyleSet;
};

export type StyleRemoveMessage = BaseMessage & {
  type: 'style:remove';
  target: string;
  keys: AllowedStyleKey[];
};

export type HighlightMessage = BaseMessage & {
  type: 'highlight';
  target: string | null;
};

export type ProtocolMessage =
  | ReadyMessage
  | ConfigRequestMessage
  | ConfigReplaceAllMessage
  | StyleUpdateMessage
  | StyleRemoveMessage
  | HighlightMessage;

export function createBaseMessage(type: ProtocolMessage['type'], sessionId: string, source: MessageSource): BaseMessage {
  return {
    type,
    sessionId,
    source,
    timestamp: Date.now(),
  };
}
