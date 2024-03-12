import { NodeRequest, NodeResponse } from '../../../core/plugin';
import {
  HonoContext,
  HonoRequest,
  ServerEnv,
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

export type ServerNodeEnv = {
  Bindings: NodeBindings;
};

export type ServerNodeMiddleware = Middleware<ServerNodeEnv>;
export type ServerNodeContext = HonoContext<ServerNodeEnv>;

type Handler = (req: NodeRequest, res: NodeResponse) => void | Promise<void>;

export const httpCallBack2HonoMid = (handler: Handler) => {
  return async (
    context: HonoContext<ServerNodeEnv & ServerEnv>,
    next: Next,
  ) => {
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
  return async (context: HonoContext<ServerNodeEnv>, next: Next) => {
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
