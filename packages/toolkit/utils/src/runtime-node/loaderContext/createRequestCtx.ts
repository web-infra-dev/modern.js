import { LoaderContext } from './createLoaderCtx';

export class RequestContext {
  private store: Map<symbol, any> = new Map();

  get<T>(loaderCtx: LoaderContext<T>): T {
    const { symbol } = loaderCtx;
    if (this.store.get(symbol)) {
      return this.store.get(symbol);
    }

    return loaderCtx.getDefaultValue();
  }

  set<T = unknown>(loaderCtx: LoaderContext, value: T) {
    const { symbol } = loaderCtx;

    this.store.set(symbol, value);
  }
}

export function createRequestContext() {
  return new RequestContext();
}
