import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import { BufferLike } from '../types';

export interface SendMessageOptions {
  mask?: boolean | undefined;
  binary?: boolean | undefined;
  compress?: boolean | undefined;
  fin?: boolean | undefined;
}

export type ServerOptions<
  U extends typeof WebSocket.WebSocket = typeof WebSocket.WebSocket,
  V extends typeof IncomingMessage = typeof IncomingMessage,
> = WebSocket.Server<U, V>['options'];

export class SocketServer<
  T extends typeof WebSocket.WebSocket = typeof WebSocket.WebSocket,
  U extends typeof IncomingMessage = typeof IncomingMessage,
> extends WebSocket.Server<T, U> {
  constructor(options?: ServerOptions<T, U>, callback?: () => void) {
    super(options, callback);
    this.handleHeartbeat();
  }

  handleHeartbeat(timeout = 30000) {
    const aliveMapping = new WeakMap<WebSocket, boolean>();
    function heartbeat(this: WebSocket) {
      aliveMapping.set(this, true);
    }
    this.on('connection', ws => {
      aliveMapping.delete(ws);
      ws.on('error', console.error);
      ws.on('pong', heartbeat);
    });

    const interval = setInterval(() => {
      this.clients.forEach(ws => {
        const mark = aliveMapping.get(ws);
        if (mark) {
          aliveMapping.delete(ws);
          ws.ping();
        } else {
          ws.terminate();
        }
      });
    }, timeout);

    this.on('close', () => {
      clearInterval(interval);
    });
  }

  broadcast(data: BufferLike, cb?: (err?: Error) => void): void;
  broadcast(
    data: BufferLike,
    options: SendMessageOptions,
    cb?: (err?: Error) => void,
  ): void;
  broadcast(
    data: BufferLike,
    optsOrCb?: SendMessageOptions | ((err?: Error) => void),
    cbOrNone?: (err?: Error) => void,
  ) {
    const opts = typeof optsOrCb === 'function' ? {} : optsOrCb;
    const cb = typeof optsOrCb === 'function' ? optsOrCb : cbOrNone;
    this.clients.forEach(
      client =>
        client.readyState === WebSocket.OPEN &&
        client.send(data, opts ?? {}, cb),
    );
  }
}
