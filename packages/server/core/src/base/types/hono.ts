import { NodeRequest, NodeResponse } from '@core/plugin';
// TODO: should unify
import { Reporter } from '@modern-js/types/server';
import { Logger } from '@modern-js/types';

export type {
  NotFoundHandler,
  Context as HonoContext,
  Env as HonoEnv,
  HonoRequest,
  Next,
} from 'hono';

// TODO: should in adapter
type Bindings = {
  node?: {
    req: NodeRequest;
    res: NodeResponse;
  };
};

type Variables = {
  reporter: Reporter;
  logger: Logger;
};

export type HonoNodeEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
