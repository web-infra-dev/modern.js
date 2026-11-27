import { AsyncLocalStorage } from 'node:async_hooks';
import { storage as modernRequestStorage } from '@modern-js/runtime-utils/node';
import type { ApplicationsStore } from './store';

const SSR_STORE_ALS_SYMBOL = Symbol.for(
  'modern-js.mf.applications.ssr-store-als',
);
const REQUEST_CONTEXT_STORE_KEY = Symbol.for(
  'modern-js.mf.applications.request-store',
);

function getStorage(): AsyncLocalStorage<ApplicationsStore> {
  const globalObj = globalThis as Record<symbol, unknown>;
  let storage = globalObj[SSR_STORE_ALS_SYMBOL] as
    AsyncLocalStorage<ApplicationsStore> | undefined;
  if (!storage) {
    storage = new AsyncLocalStorage<ApplicationsStore>();
    globalObj[SSR_STORE_ALS_SYMBOL] = storage;
  }
  return storage;
}

function getModernRequestContext(): Record<symbol, unknown> | undefined {
  try {
    return modernRequestStorage.useContext() as unknown as
      Record<symbol, unknown> | undefined;
  } catch {
    return undefined;
  }
}

export function setActiveApplicationsStore(
  store: ApplicationsStore | undefined,
): void {
  const reqCtx = getModernRequestContext();
  if (reqCtx) {
    reqCtx[REQUEST_CONTEXT_STORE_KEY] = store;
  }
}

export function getActiveApplicationsStore(): ApplicationsStore | undefined {
  const fromAls = getStorage().getStore();
  if (fromAls) return fromAls;
  const reqCtx = getModernRequestContext();
  return reqCtx?.[REQUEST_CONTEXT_STORE_KEY] as ApplicationsStore | undefined;
}

export function runWithApplicationsStore<T>(
  store: ApplicationsStore,
  fn: () => T,
): T {
  const reqCtx = getModernRequestContext();
  if (reqCtx) {
    reqCtx[REQUEST_CONTEXT_STORE_KEY] = store;
  }
  return getStorage().run(store, fn);
}
