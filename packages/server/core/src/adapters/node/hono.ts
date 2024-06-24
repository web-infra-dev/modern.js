import {
  NodeRequest,
  NodeResponse,
  Context,
  HonoRequest,
  ServerEnv,
  Middleware,
  Next,
  ServerManifest,
} from '../../types';

type NodeBindings = {
  node: {
    req: NodeRequest & {
      __honoRequest?: HonoRequest;
      __templates?: Record<string, string>;
      __serverManifest?: ServerManifest;
    };
    res: NodeResponse;
  };
};

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
    // for bff.enableHandleWeb
    req.__honoRequest = context.req;
    req.__templates = context.get('templates') || {};
    req.__serverManifest = context.get('serverManifest') || {};
    await handler(req, res);
    // make sure res.headersSent is set, because when using pipe, headersSent is not set immediately
    await new Promise(resolve => setTimeout(resolve, 0));
    // Avoid memory leaks in node versions 18 and 20
    delete req.__honoRequest;
    delete req.__templates;
    delete req.__serverManifest;
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
