import type { Context } from './types';

type LoaderContext = Map<string, unknown>;

type Var = {
  loaderContext: LoaderContext;
};

interface Env {
  Variables: Var;
}

const LOADER_CONTEXT = 'loaderContext';

export function getLoaderCtx(c: Context<Env>): LoaderContext {
  const loaderContext = c.get(LOADER_CONTEXT);
  if (loaderContext) {
    return loaderContext;
  } else {
    const loaderContext = new Map();

    c.set(LOADER_CONTEXT, loaderContext);
    return loaderContext;
  }
}
