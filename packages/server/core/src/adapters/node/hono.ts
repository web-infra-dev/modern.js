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
      await new Promise<void>(resolve => {
        const finish = () => {
          res.removeListener('finish', finish);
          res.removeListener('close', finish);
          resolve();
        };
        res.once('finish', finish);
        res.once('close', finish);
        if (res.writableFinished || res.destroyed) finish();
      });
      context.res = new Response(null);
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
  return async (context: Context<ServerNodeEnv & ServerEnv>, next: Next) => {
    return new Promise<void>((resolve, reject) => {
      const { req, res } = context.env.node;
      let settled = false;
      let enteredNext = false;
      const detach = () => {
        res.removeListener('finish', finish);
        res.removeListener('close', finish);
      };
      const settle = (error?: unknown) => {
        if (settled) return;
        settled = true;
        detach();
        if (error !== undefined) reject(error);
        else resolve();
      };
      const finish = () => {
        if (settled || enteredNext) return;
        // Native Connect middleware owns the already-sent bytes. A bodyless
        // placeholder retires Hono/SSR work without leaving an unread 404 body.
        context.res = new Response(null);
        context.finalized = true;
        settle();
      };
      res.once('finish', finish);
      res.once('close', finish);
      try {
        const result = handler(req, res, error => {
          if (settled || enteredNext) return;
          enteredNext = true;
          detach();
          if (error) settle(error);
          else
            Promise.resolve()
              .then(next)
              .then(() => settle(), settle);
        }) as unknown;
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          const producer = Promise.resolve(result);
          const observed = context.get('ssrWork')?.track(producer) || producer;
          void observed.catch(settle);
        }
      } catch (error) {
        settle(error);
      }
    });
  };
};

/**
 * Because we are not sure how use devServer.before and devServer.after, we add a new function to handle the mock middleware
 * And we supose mock handler always process the res directly
 * So we need to set the context.finalized = true and resolve the promise
 */
export const connectMockMid2HonoMid = connectMid2HonoMid;
