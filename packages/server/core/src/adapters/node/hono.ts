import type {
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
    res: NodeResponse & {
      _modernBodyPiped?: boolean;
    };
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
    const onPipe = () => {
      res._modernBodyPiped = true;
    };
    res.once('pipe', onPipe);
    // for bff.enableHandleWeb
    req.__honoRequest = context.req;
    req.__templates = context.get('templates') || {};
    req.__serverManifest = context.get('serverManifest') || {};

    try {
      await handler(req, res);
    } finally {
      // Avoid memory leaks in node versions 18 and 20
      delete req.__honoRequest;
      delete req.__templates;
      delete req.__serverManifest;
      res.removeListener('pipe', onPipe);
    }

    if (res.headersSent || res._modernBodyPiped) {
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
