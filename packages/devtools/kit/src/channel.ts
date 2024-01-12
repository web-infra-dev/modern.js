import { nanoid } from 'nanoid';
import type { ChannelOptions } from 'birpc';

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

export class MessagePortTimeout extends Error {
  constructor() {
    super('Connection to target message channel port timed out');
  }
}

export type PostMessageListener = (ev: MessageEvent) => void;

export interface PostMessageTarget {
  postMessage: (
    message: any,
    targetOrigin: string,
    transfer?: Transferable[],
  ) => void;
  addEventListener: (
    type: string,
    listener: PostMessageListener,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: PostMessageListener,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export class MessagePortChannel implements ChannelOptions {
  static link(target: PostMessageTarget, tag = 'channel:connect') {
    return new Promise<MessagePortChannel>((resolve, reject) => {
      const id = nanoid();
      const { port1, port2 } = new MessageChannel();
      const handleMessage = (e: MessageEvent) => {
        if (e.data.tag !== tag) return;
        if (e.data.type !== 'accepted') return;
        if (e.data.id !== id) return;
        port2.removeEventListener('message', handleMessage);
        resolve(new MessagePortChannel(port2));
      };
      port2.addEventListener('messageerror', reject, { once: true });
      port2.addEventListener('message', handleMessage);
      port2.start();
      target.postMessage({ tag, type: 'request', id }, '*', [port1]);
    });
  }

  static wait(target: PostMessageTarget, tag = 'channel:connect') {
    return new Promise<MessagePortChannel>((resolve, reject) => {
      const handleMessage = async (e: MessageEvent) => {
        const { data } = e;
        if (!data) return;
        if (typeof data !== 'object') return;
        if (data.tag !== tag) return;
        if (data.type !== 'request') return;
        target.removeEventListener('message', handleMessage);
        const port = e.ports[0];
        if (port) {
          port.postMessage({ type: 'accepted', id: data.id, tag });
          resolve(new MessagePortChannel(port));
        } else {
          reject(new Error('Missing message channel port from remote.'));
        }
      };
      target.addEventListener('message', handleMessage);
    });
  }

  port: MessagePort;

  constructor(port: MessagePort) {
    this.port = port;
    this.port.start();
    const binds: ChannelOptions = {
      on: this.on.bind(this),
      post: this.post.bind(this),
    };
    Object.assign(this, binds);
  }

  get handlers() {
    return {
      on: this.on.bind(this),
      post: this.post.bind(this),
    };
  }

  post(data: any, ...extras: any[]): any {
    if (extras.length) {
      throw new Error('Unexpected extra parameters.');
    }
    this.port.postMessage(data);
  }

  on(fn: (data: any, ...extras: any[]) => void): any {
    this.port.addEventListener('message', e => fn(e.data));
  }
}
