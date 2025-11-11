import type { NodeRequest, NodeResponse } from '@modern-js/types/server';
import type { Context, Middleware, Next, ServerEnv } from '../../types';
import { type NodeBindings, isResFinalized } from './helper';

export type ServerNodeEnv = {
  Bindings: NodeBindings;
};

export type ServerNodeMiddleware = Middleware<ServerNodeEnv>;
export type ServerNodeContext = Context<ServerNodeEnv>;

type Handler = (req: NodeRequest, res: NodeResponse) => void | Promise<void>;

// when using the node.js http callback as hono middleware,
// it needs to be the last middleware, because it's possible to send res directly in the http callback.
export const httpCallBack2HonoMid = (handler: Handler) => {
  return async (context: Context<ServerNodeEnv & ServerEnv>, next: Next) => {
    const { req, res } = context.env.node;
    const onPipe = () => {
      res._modernBodyPiped = true;
    };
    res.once('pipe', onPipe);
    // for bff.enableHandleWeb
    req.__honoRequest = context.req;
    req.__templates = context.get('templates') || {};
    req.__serverManifest = context.get('serverManifest') || {};
    req.__rscServerManifest = context.get('rscServerManifest');
    req.__rscClientManifest = context.get('rscClientManifest');
    req.__rscSSRManifest = context.get('rscSSRManifest');

    try {
      await handler(req, res);
    } finally {
      // Avoid memory leaks in node versions 18 and 20
      delete req.__honoRequest;
      delete req.__templates;
      delete req.__serverManifest;
      delete req.__rscServerManifest;
      delete req.__rscClientManifest;
      delete req.__rscSSRManifest;
      res.removeListener('pipe', onPipe);
    }

    if (isResFinalized(res)) {
      // Fix: ensure context.res is initialized before setting finalized
      // This prevents c.#res from being undefined in Hono
      const _ = context.res;
      context.finalized = true;
    } else {
      await next();
    }
  };
};

type ConnectMiddleware =
  | ((
      req: NodeRequest,
      res: NodeResponse,
      callback: (...args: unknown[]) => void,
    ) => void)
  | ((req: NodeRequest, res: NodeResponse) => void);

const noop = () => {};

export const connectMid2HonoMid = (handler: ConnectMiddleware): Middleware => {
  return async (context: Context<ServerNodeEnv>, next: Next) => {
    return new Promise((resolve, reject) => {
      const { req, res } = context.env.node;
      if (handler.length < 3) {
        resolve(handler(req, res, noop));
      } else {
        handler(req, res, err => {
          if (err) {
            reject(err);
          } else {
            resolve(next());
          }
        });
      }
    });
  };
};

/**
 * Because we are not sure how use devServer.before and devServer.after, we add a new function to handle the mock middleware
 * And we supose mock handler always process the res directly
 * So we need to set the context.finalized = true and resolve the promise
 */
export const connectMockMid2HonoMid = (
  handler: ConnectMiddleware,
): Middleware => {
  return async (context: Context<ServerNodeEnv>, next: Next) => {
    return new Promise((resolve, reject) => {
      const { req, res } = context.env.node;
      // The function lenth < 3 means the handler is not a function with next
      if (handler.length < 3) {
        res.once('finish', () => {
          // Fix: ensure context.res is initialized before setting finalized
          // This prevents c.#res from being undefined in Hono
          const _ = context.res;
          context.finalized = true;
          resolve();
        });
        handler(req, res, noop);
      } else {
        handler(req, res, err => {
          if (err) {
            reject(err);
          } else {
            resolve(next());
          }
        });
      }
    });
  };
};
