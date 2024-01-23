import { NodeRequest, NodeResponse } from '@core/plugin';
import { HonoContext, HonoNodeEnv, Next } from '../types';

type Handler = (req: NodeRequest, res: NodeResponse) => void;

export const httpCallBack2HonoMid = (handler: Handler) => {
  return async (context: HonoContext<HonoNodeEnv>, next: Next) => {
    const { req, res } = context.env.node!;
    handler(req, res);
    await next();
  };
};

type ConnectMiddleware = (
  req: NodeRequest,
  res: NodeResponse,
  callback?: (...args: unknown[]) => void,
) => void;

export const connectMid2HonoMid = (handler: ConnectMiddleware) => {
  return async (context: HonoContext<HonoNodeEnv>, next: Next) => {
    return new Promise((resolve, reject) => {
      const { req, res } = context.env.node!;
      if (handler.length < 3) {
        resolve(handler(req, res));
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
