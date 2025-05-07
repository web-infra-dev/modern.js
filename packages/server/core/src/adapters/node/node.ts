import { type Server as NodeServer, ServerResponse } from 'node:http';
import type {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'node:http2';
import type { Server as NodeHttpsServer } from 'node:https';
import type { NodeRequest, NodeResponse } from '@modern-js/types/server';
import cloneable from 'cloneable-readable';
import type { RequestHandler } from '../../types';
import { isResFinalized } from './helper';
import { installGlobals } from './polyfills/install';
import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from './polyfills/stream';

export { writeReadableStreamToWritable } from './polyfills';

installGlobals();

export const createWebRequest = (
  req: NodeRequest,
  res: NodeResponse,
  body?: BodyInit,
): Request => {
  const headerRecord: [string, string][] = [];

  for (const [key, value] of Object.entries(req.headers)) {
    if (key.startsWith(':')) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          headerRecord.push([key, item]);
        }
      }
    } else if (value !== undefined) {
      if (typeof value === 'string') {
        headerRecord.push([key, value]);
      }
    }
  }

  const { method } = req;

  const controller = new AbortController();
  const init: RequestInit = {
    method,
    headers: headerRecord,
    signal: controller.signal,
  };
  res.on('close', () => controller.abort('res closed'));

  const url = `http://${req.headers.host}${req.url}`;

  const needsRequestBody = body || !(method === 'GET' || method === 'HEAD');
  const cloneableReq = needsRequestBody ? cloneable(req) : null;

  if (needsRequestBody) {
    if (body) {
      init.body = body;
    } else {
      const stream = cloneableReq!.clone();
      init.body = createReadableStreamFromReadable(stream);
    }
    (init as { duplex: 'half' }).duplex = 'half';
  }

  const originalRequest = new Request(url, init);

  if (needsRequestBody) {
    return new Proxy(originalRequest, {
      get(target, prop) {
        if (
          ['json', 'text', 'blob', 'arrayBuffer', 'formData', 'body'].includes(
            prop as string,
          )
        ) {
          cloneableReq!.resume();
        }
        return target[prop as keyof Request];
      },
    });
  }

  return originalRequest;
};

export const sendResponse = async (response: Response, res: NodeResponse) => {
  res.statusMessage = response.statusText;
  res.statusCode = response.status;

  const cookies: string[] = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === 'set-cookie') {
      cookies.push(value);
    } else {
      res.setHeader(key, value);
    }
  }

  if (cookies.length > 0) {
    res.setHeader('set-cookie', cookies);
  }

  if (
    response.headers.get('Content-Type')?.match(/text\/event-stream/i) &&
    res instanceof ServerResponse
  ) {
    res.flushHeaders();
  }

  if (response.body) {
    await writeReadableStreamToWritable(response.body, res);
  } else {
    res.end();
  }
};

/**
 * The function is modified based on
 * https://github.com/honojs/node-server/blob/8cea466fd05e6d2e99c28011fc0e2c2d3f3397c9/src/listener.ts
 *
 * MIT Licensed
 * https://github.com/honojs/node-server/tree/8cea466fd05e6d2e99c28011fc0e2c2d3f3397c9?tab=readme-ov-file#license
 */
const handleResponseError = (e: unknown, res: NodeResponse) => {
  const err = (
    e instanceof Error ? e : new Error('unknown error', { cause: e })
  ) as Error & {
    code: string;
  };
  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    console.info('The user aborted a request.');
  } else {
    console.error(e);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end(`Error: ${err.message}`);
    res.destroy(err);
  }
};

const getRequestListener = (handler: RequestHandler) => {
  return async (req: NodeRequest, res: NodeResponse) => {
    try {
      const request = createWebRequest(req, res);

      const response = await handler(request, {
        node: {
          req,
          res,
        },
      });

      /**
       * When response.res exists, it means that the response is hono's context
       * https://github.com/honojs/hono/blob/main/src/compose.ts#L60
       * and the response is not yet finished after the middleware is executed
       *
       * One scenario is the code for mock:
       * ```
       *   'GET /api/addInfo': (req: any, res: any) => {
       *      setTimeout(() => {
       *        res.end('delay 2000ms');
       *      }, 2000);
       *    },
       * ```
       */

      if (!(response as any).res && !isResFinalized(res)) {
        await sendResponse(response, res);
      }
    } catch (error) {
      return handleResponseError(error, res);
    }
  };
};

type NodeServerWrapper = (NodeServer | NodeHttpsServer | Http2SecureServer) & {
  getRequestListener: () => ReturnType<typeof getRequestListener>;
  getRequestHandler: () => RequestHandler;
};

export const createNodeServer = async (
  requestHandler: RequestHandler,
  httpsOptions?: {
    key?: string | Buffer;
    cert?: string | Buffer;
  },
  http2?: boolean,
): Promise<NodeServerWrapper> => {
  const requestListener = getRequestListener(requestHandler);

  let nodeServer;
  if (httpsOptions) {
    if (http2) {
      const { createSecureServer } = await import('node:http2');
      nodeServer = createSecureServer(
        {
          allowHTTP1: true,
          maxSessionMemory: 1024,
          ...httpsOptions,
        },
        (req: Http2ServerRequest, res: Http2ServerResponse) => {
          return requestListener(req, res as unknown as NodeResponse);
        },
      ) as NodeServerWrapper;
    } else {
      const { createServer } = await import('node:https');
      nodeServer = createServer(
        httpsOptions,
        requestListener,
      ) as NodeServerWrapper;
    }
  } else {
    const { createServer } = await import('node:http');
    nodeServer = createServer(requestListener) as NodeServerWrapper;
  }

  nodeServer.getRequestListener = () => requestListener;
  nodeServer.getRequestHandler = () => requestHandler;

  return nodeServer;
};
