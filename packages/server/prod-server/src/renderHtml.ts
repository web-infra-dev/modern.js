import {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
  OutgoingMessage,
  OutgoingHttpHeaders,
} from 'http';
import { Readable } from 'stream';
import { Socket } from 'net';
import { Server } from './server';
import { ModernServerOptions } from './type';
import { isRedirect } from './utils';

class IncomingMessageLike extends Readable {
  headers: IncomingHttpHeaders;

  method?: string | undefined;

  url?: string | undefined;

  socket: Socket;

  constructor({
    method,
    url,
    headers,
  }: {
    method?: string;
    url?: string;
    headers?: IncomingHttpHeaders;
  }) {
    super();
    this.socket = new Socket();
    this.headers = headers || {};
    // mock the request host as `localhost:8080`
    this.headers.host = 'localhost:8080';
    this.method = method || 'get';
    this.url = url;
  }
}

class ServerResponseLike extends OutgoingMessage {
  statusCode: number;

  public data: string[];

  constructor() {
    super();
    this.statusCode = 200;
    this.data = [];
  }

  end(cb?: (() => void) | undefined): this;
  end(chunk: any, cb?: (() => void) | undefined): this;
  end(
    chunk: any,
    encoding: BufferEncoding,
    cb?: (() => void) | undefined,
  ): this;
  end(chunk?: unknown, _encoding?: unknown, cb?: unknown): this {
    this.data.push((chunk as any).toString());

    cb && (cb as () => void)();
    this.emit('finish');

    return this;
  }
}

class CustomServer extends Server {
  public async render(
    req: IncomingMessageLike,
    res: ServerResponseLike | unknown,
    _url?: string | undefined,
  ): Promise<string | Readable | null> {
    const handler = this.getRequestHandler();
    handler(req as unknown as IncomingMessage, res as ServerResponse);
    return null;
  }
}

export interface RenderHtmlOptions {
  /** request url */
  url: string;

  /** request method */
  method?: string;

  /** request headers  */
  headers?: IncomingHttpHeaders;

  /** request body */
  body?: string;

  serverOptions: ModernServerOptions;
}

export interface ReturnResponse {
  headers: OutgoingHttpHeaders;
  redirected: boolean;
  status: number;
  url: string;
  body: string;
}

async function renderHtml({
  url,
  method,
  headers,
  body,
  serverOptions,
}: RenderHtmlOptions): Promise<ReturnResponse> {
  const req = new IncomingMessageLike({
    method,
    url,
    headers,
  });

  if (body) {
    req.push(body);
    req.push(null);
  }

  const res = new ServerResponseLike();

  const customServer = new CustomServer(serverOptions);

  await customServer.init({
    disableHttpServer: true,
  });

  customServer.render(req, res);

  return new Promise(resolve => {
    res.addListener('finish', () => {
      resolve({
        headers: res.getHeaders(),
        redirected: isRedirect(res.statusCode),
        status: res.statusCode,
        url,
        body: res.data.join(),
      });
    });
  });
}

module.exports = renderHtml;
