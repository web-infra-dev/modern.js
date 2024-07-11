import { createBirpc } from 'birpc';
import {
  MessagePortChannel,
  PostMessageListener,
  PostMessageTarget,
} from '@modern-js/devtools-kit/runtime';
import { WallAgent } from '../../src/utils/react-devtools';

beforeAll(() => {
  globalThis.MessageChannel = require('worker_threads').MessageChannel as any;
});

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

describe('WallAgent', () => {
  it('should bind to birpc returns', async () => {
    const target = new MockPostMessageTarget();
    const [channel1, channel2] = await Promise.all([
      MessagePortChannel.wait(target, 'foo:bar'),
      MessagePortChannel.link(target, 'foo:bar'),
    ]);
    const remote1 = createBirpc({}, channel1);
    const remote2 = createBirpc({}, channel2);
    const wall1 = new WallAgent()
    wall1.bindRemote(remote1, 'sendRemote');
    const wall2 = new WallAgent()
    wall2.bindRemote(remote2, 'sendRemote');

    const fn = jest.fn();
    wall1.listen(fn);
    wall2.send('addCount', { value: 2 }, [{ answer: 42 }]);
    await new Promise(resolve => {
      wall1.listen(resolve);
    });
    expect(fn.mock.calls.length).toBe(1);
    expect(fn.mock.calls.map(params => params[0])).toMatchInlineSnapshot(`
      [
        {
          "event": "addCount",
          "payload": {
            "value": 2,
          },
          "transferable": [
            {
              "answer": 42,
            },
          ],
        },
      ]
    `);
    channel1.port.close();
    channel2.port.close();
  });
});
