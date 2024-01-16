import type { Context } from 'hono';
import type { NodeRequest, NodeResponse } from './types';

type Handler = (req: NodeRequest, res: NodeResponse) => void;

export const httpCallBack2HonoMid = (handler: Handler) => {
  return (context: Context) => {
    const { req, res } = context.env.node;
    return handler(req, res);
  };
};
