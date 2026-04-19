// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostMessageTransport } from './PostMessageTransport';

describe('PostMessageTransport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts messages to the target window using the expected origin', () => {
    const targetWindow = { postMessage: vi.fn(), closed: false } as unknown as Window;
    const transport = new PostMessageTransport('session-1', () => targetWindow, () => 'https://client.test');

    transport.send({ type: 'hello', sessionId: 'session-1', source: 'editor', timestamp: 1 });

    expect(targetWindow.postMessage).toHaveBeenCalledWith(
      { type: 'hello', sessionId: 'session-1', source: 'editor', timestamp: 1 },
      'https://client.test',
    );
  });

  it('subscribes only to matching origin and session messages', () => {
    const handler = vi.fn();
    const transport = new PostMessageTransport('session-1', () => null, () => 'https://client.test');
    const unsubscribe = transport.subscribe(handler);

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://client.test',
      data: { type: 'hello', sessionId: 'session-1', source: 'preview', timestamp: 1 },
    }));

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://evil.test',
      data: { type: 'hello', sessionId: 'session-1', source: 'preview', timestamp: 2 },
    }));

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://client.test',
      data: { type: 'hello', sessionId: 'session-2', source: 'preview', timestamp: 3 },
    }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'hello', sessionId: 'session-1', source: 'preview', timestamp: 1 });

    unsubscribe();
  });
});
