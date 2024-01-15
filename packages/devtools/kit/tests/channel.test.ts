import { once } from 'events';
import {
  MessagePortChannel,
  PostMessageListener,
  PostMessageTarget,
} from '../src/channel';

class MockPostMessageTarget implements PostMessageTarget {
  private listeners: Record<string, PostMessageListener[]> = {};

  postMessage(
    message: any,
    targetOrigin: string,
    transfer?: Transferable[],
  ): void {
    // Simulate the behavior of postMessage, immediately triggering the message event.
    setTimeout(() => {
      const event = new MessageEvent('message', {
        data: message,
        ports: transfer as MessagePort[],
      });
      this.dispatchEvent(event);
    }, 0);
  }

  addEventListener(
    type: string,
    listener: PostMessageListener,
    _options?: any,
  ): void {
    (this.listeners[type] ||= []).push(listener);
  }

  removeEventListener(
    type: string,
    listener: PostMessageListener,
    _options?: any,
  ): void {
    if (this.listeners[type]) {
      const listenerIndex = this.listeners[type].indexOf(listener);
      if (listenerIndex !== -1) {
        this.listeners[type].splice(listenerIndex, 1);
      }
    }
  }

  // 辅助方法，用于分发事件
  private dispatchEvent(event: MessageEvent): void {
    const listeners = this.listeners[event.type] || [];
    for (const listener of listeners) {
      listener(event);
    }
  }
}

beforeAll(() => {
  globalThis.MessageChannel = require('worker_threads').MessageChannel as any;
});

describe('MessagePortChannel', () => {
  it('should use message channel as basis', async () => {
    const { port1, port2 } = new MessageChannel();
    const fn = jest.fn();

    port2.postMessage('some_message_foo');
    port1.addEventListener('message', fn);
    await once(port1, 'message');

    expect(fn.mock.calls.length).toBe(1);
    expect(fn.mock.calls.map(params => params[0].data)).toMatchInlineSnapshot(`
      [
        "some_message_foo",
      ]
    `);
  });

  it('can be created from existing pairs', async () => {
    const { port1, port2 } = new MessageChannel();
    const channel1 = new MessagePortChannel(port1);
    const channel2 = new MessagePortChannel(port2);

    const fn = jest.fn();

    channel1.on(fn);
    channel2.post('some_message_bar');
    await new Promise(resolve => {
      channel1.on(resolve);
    });

    expect(fn.mock.calls.length).toBe(1);
    expect(fn.mock.calls.map(params => params[0])).toMatchInlineSnapshot(`
      [
        "some_message_bar",
      ]
    `);
  });

  it('can be created by link/wait methods', async () => {
    const target = new MockPostMessageTarget();
    const [channel1, channel2] = await Promise.all([
      MessagePortChannel.wait(target, 'foo:bar'),
      MessagePortChannel.link(target, 'foo:bar'),
    ]);

    const fn = jest.fn();

    channel1.on(fn);
    channel2.post('some_message_baz');
    await new Promise(resolve => {
      channel1.on(resolve);
    });

    expect(fn.mock.calls.length).toBe(1);
    expect(fn.mock.calls.map(params => params[0])).toMatchInlineSnapshot(`
      [
        "some_message_baz",
      ]
    `);
  });
});
