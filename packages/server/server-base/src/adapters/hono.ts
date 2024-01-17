import type { Context } from 'hono';
import type { NodeRequest, NodeResponse } from '@modern-js/server-core';

type Handler = (req: NodeRequest, res: NodeResponse) => void;

type Bindings = {
  node?: {
    req: NodeRequest;
    res: NodeResponse;
  };
};

export type HonoNodeEnv = {
  Bindings: Bindings;
};

export const httpCallBack2HonoMid = (handler: Handler) => {
  return (context: Context<HonoNodeEnv>) => {
    const { req, res } = context.env.node!;
    return handler(req, res);
  };
};
