import type { NodeRequest, NodeResponse } from '@modern-js/server-core';

export type {
  NotFoundHandler,
  Context as HonoContext,
  Env as HonoEnv,
  HonoRequest,
} from 'hono';

type Bindings = {
  node?: {
    req: NodeRequest;
    res: NodeResponse;
  };
};

export type HonoNodeEnv = {
  Bindings: Bindings;
};
