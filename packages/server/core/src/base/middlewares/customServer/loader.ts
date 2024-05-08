import type { Context, ServerEnv } from '../../../core/server';

type LoaderContext = Map<string, unknown>;

type Var = {
  loaderContext: LoaderContext;
};

interface Env {
  Variables: Var;
}

export function getLoaderCtx(c: Context<Env & ServerEnv>): LoaderContext {
  const loaderContext = c.get('loaderContext');
  if (loaderContext) {
    return loaderContext;
  } else {
    const loaderContext = new Map();
    const logger = c.get('logger');
    logger && loaderContext.set('logger', logger);

    const metrics = c.get('metrics');
    metrics && loaderContext.set('metrics', metrics);

    const reporter = c.get('reporter');
    reporter && loaderContext.set('reporter', reporter);

    c.set('loaderContext', loaderContext);
    return loaderContext;
  }
}
