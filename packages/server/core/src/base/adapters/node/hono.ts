import { Metrics, Reporter } from '@modern-js/types/server';
import { Logger } from '@modern-js/types';
import { NodeRequest, NodeResponse } from '../../../core/plugin';
import {
  HonoContext,
  HonoRequest,
  Middleware,
  Next,
} from '../../../core/server';

type NodeBindings = {
  node: {
    req: NodeRequest & {
      __honoRequest: HonoRequest;
      __templates: Record<string, string>;
    };
    res: NodeResponse;
  };
};

type NodeVariables = {
  reporter: Reporter;
  logger: Logger;
  templates?: Record<string, string>;
  metrics?: Metrics;
};

export type HonoNodeEnv = {
  Bindings: NodeBindings;
  Variables: NodeVariables;
};

export type ServerNodeMiddleware = Middleware<HonoNodeEnv>;
export type ServerNodeContext = HonoContext<HonoNodeEnv>;

type Handler = (req: NodeRequest, res: NodeResponse) => void | Promise<void>;

export const httpCallBack2HonoMid = (handler: Handler) => {
  return async (context: HonoContext<HonoNodeEnv>, next: Next) => {
    const { req, res } = context.env.node;
    // for bff.enableHandleWeb
    req.__honoRequest = context.req;
    req.__templates = context.get('templates') || {};
    await handler(req, res);
    if (res.headersSent) {
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const connectMid2HonoMid = (handler: ConnectMiddleware): Middleware => {
  return async (context: HonoContext<HonoNodeEnv>, next: Next) => {
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
