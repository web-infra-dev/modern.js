import EventEmitter from 'events';
import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import httpMocks from 'node-mocks-http';

export type Options = {
  url: string;
  headers: {
    host: string;
    [key: string]: string;
  };
  [propName: string]: any;
};

export const compile =
  (requestHandler: (req: IncomingMessage, res: ServerResponse) => void) =>
  (options: Options, extend = {}): Promise<string> =>
    new Promise((resolve, reject) => {
      const req = httpMocks.createRequest({
        ...options,
        eventEmitter: Readable,
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

      Object.assign(req, extend);
      const proxyRes = new Proxy(res, {
        get(obj: any, prop: any) {
          if (typeof prop === 'symbol' && !obj[prop]) {
            return null;
          }
          return obj[prop];
        },
      });

      res.on('finish', () => {
        if (res.statusCode !== 200) {
          reject(new Error(res.statusMessage));
        } else {
          resolve(res._getData());
        }
      });

      res.on('error', (e: Error) => reject(e));
      try {
        requestHandler(req, proxyRes);
      } catch (e) {
        reject(e);
      }
    });
