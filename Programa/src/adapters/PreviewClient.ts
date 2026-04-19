
import { Transport } from '../infrastructure/transport/Transport';
import { ProtocolMessage, EditableStyleSet, StyleConfig } from '../domain/models';

export class PreviewClient {
  constructor(private transport: Transport, private sessionId: string) {}

  private createMessage(type: string): any {
    return {
      type,
      sessionId: this.sessionId,
      source: 'editor',
      timestamp: Date.now(),
    };
  }

  sendHello() {
    this.transport.send(this.createMessage('hello'));
  }

  requestInfo() {
    this.transport.send(this.createMessage('preview:info:request'));
  }

  notifyProjectLoad(project: any) {
    this.transport.send({
      ...this.createMessage('project:load'),
      project,
    });
  }

  removeStyles(target: string, keys: string[]) {
    this.transport.send({
      ...this.createMessage('style:remove'),
      target,
      keys,
    } as any);
  }

  updateStyle(target: string, styles: EditableStyleSet) {
    this.transport.send({
      ...this.createMessage('style:update'),
      target,
      styles,
    });
  }

  highlight(target: string | null) {
    this.transport.send({
      ...this.createMessage('highlight'),
      target,
    });
  }

  sendFullConfig(config: StyleConfig) {
    this.transport.send({
      ...this.createMessage('config:replaceAll'),
      config,
    });
  }
}
