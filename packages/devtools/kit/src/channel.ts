import { nanoid } from 'nanoid';
import type { ChannelOptions } from 'birpc';
import { Hookable, createHooks } from 'hookable';

export class WebSocketChannel implements ChannelOptions {
  static link(ws: WebSocket) {
    return new Promise<WebSocketChannel>((resolve, reject) => {
      const ret = new WebSocketChannel(ws);
      if (ws.readyState === ws.OPEN) {
        resolve(ret);
      } else {
        ws.addEventListener('open', () => resolve(ret), { once: true });
        ws.addEventListener('error', reject, { once: true });
        ws.addEventListener('close', reject, { once: true });
        setTimeout(reject, 1000);
      }
    });
  }

  protected ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
    const binds: ChannelOptions = {
      on: this.on.bind(this),
      post: this.post.bind(this),
      deserialize: this.deserialize.bind(this),
      serialize: this.serialize.bind(this),
    };
    Object.assign(this, binds);
  }

  get handlers() {
    return {
      on: this.on.bind(this),
      post: this.post.bind(this),
      deserialize: this.deserialize.bind(this),
      serialize: this.serialize.bind(this),
    };
  }

  post(data: any, ...extras: any[]): any {
    if (extras.length) {
      throw new Error('Unexpected extra parameters.');
    }
    this.ws.send(data);
  }

  on(fn: (data: any, ...extras: any[]) => void): any {
    this.ws.onmessage = fn;
  }

  serialize(data: any): any {
    return JSON.stringify(data);
  }

  deserialize(e: any): any {
    return JSON.parse(e.data.toString());
  }
}

export type PostMessageTarget = Pick<Window, 'postMessage'>;

export class MessagePortTimeout extends Error {
  constructor() {
    super('Connection to target message channel port timed out');
  }
}

export class MessagePortChannel implements ChannelOptions {
  static link(target: PostMessageTarget, tag = 'channel:connect') {
    return new Promise<MessagePortChannel>((resolve, _reject) => {
      const id = nanoid();
      const { port1, port2 } = new MessageChannel();
      const handleMessage = (e: MessageEvent) => {
        if (e.data.tag !== tag) return;
        if (e.data.type !== 'accepted') return;
        if (e.data.id !== id) return;
        port2.onmessage = null;
        resolve(new MessagePortChannel(port2));
      };
      // const handleError = (e: MessageEvent) => reject(e.data);
      port2.onmessage = handleMessage;
      // port2.addEventListener('messageerror', handleError, { once: true });
      // setTimeout(() => reject(new MessagePortTimeout()), 1000);
      target.postMessage({ tag, type: 'request', id }, '*', [port1]);
    });
  }

  static wait(tag = 'channel:connect') {
    return new Promise<MessagePortChannel>((resolve, reject) => {
      const handleMessage = async (e: MessageEvent) => {
        const { data } = e;
        if (!data) return;
        if (typeof data !== 'object') return;
        if (data.tag !== tag) return;
        if (data.type !== 'request') return;
        window.removeEventListener('message', handleMessage);
        const port = e.ports[0];
        if (port) {
          port.postMessage({ type: 'accepted', id: data.id, tag });
          resolve(new MessagePortChannel(port));
        } else {
          reject(new Error('Missing message channel port from remote.'));
        }
      };
      window.addEventListener('message', handleMessage);
    });
  }

  protected port: MessagePort;

  protected hooks: Hookable<{ message: (e: MessageEvent<any>) => void }>;

  constructor(port: MessagePort) {
    this.port = port;
    this.hooks = createHooks();
    this.port.onmessage = e => this.hooks.callHook('message', e);
    const binds: ChannelOptions = {
      on: this.on.bind(this),
      post: this.post.bind(this),
      deserialize: this.deserialize.bind(this),
      serialize: this.serialize.bind(this),
    };
    Object.assign(this, binds);
  }

  get handlers() {
    return {
      on: this.on.bind(this),
      post: this.post.bind(this),
      deserialize: this.deserialize.bind(this),
      serialize: this.serialize.bind(this),
    };
  }

  post(data: any, ...extras: any[]): any {
    if (extras.length) {
      throw new Error('Unexpected extra parameters.');
    }
    this.port.postMessage(data);
  }

  on(fn: (data: any, ...extras: any[]) => void): any {
    this.hooks.hook('message', fn);
  }

  serialize(e: any): any {
    return e.data;
  }

  deserialize(e: any): any {
    return e.data;
  }
}
