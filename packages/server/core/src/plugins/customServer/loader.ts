import type { Context } from '../../types';

type LoaderContext = Map<string, unknown>;

type Var = {
  loaderContext: LoaderContext;
};

interface Env {
  Variables: Var;
}

export function getLoaderCtx(c: Context<Env>): LoaderContext {
  const loaderContext = c.get('loaderContext');
  if (loaderContext) {
    return loaderContext;
  } else {
    const loaderContext = new Map();

    c.set('loaderContext', loaderContext);
    return loaderContext;
  }
}
