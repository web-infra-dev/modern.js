import { NodeRequest, NodeResponse } from '@core/plugin';

export type {
  NotFoundHandler,
  Context as HonoContext,
  Env as HonoEnv,
  HonoRequest,
  Next,
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
