import type { ApplicationsStore } from './store';

const BROWSER_STORE_SYMBOL = Symbol.for(
  'modern-js.mf.applications.browser-store',
);

export function setActiveApplicationsStore(
  store: ApplicationsStore | undefined,
): void {
  (globalThis as Record<symbol, unknown>)[BROWSER_STORE_SYMBOL] = store;
}

export function getActiveApplicationsStore(): ApplicationsStore | undefined {
  return (globalThis as Record<symbol, unknown>)[BROWSER_STORE_SYMBOL] as
    ApplicationsStore | undefined;
}

export function runWithApplicationsStore<T>(
  store: ApplicationsStore,
  fn: () => T,
): T {
  const previous = getActiveApplicationsStore();
  setActiveApplicationsStore(store);
  try {
    return fn();
  } finally {
    if (previous !== undefined && previous !== store) {
      setActiveApplicationsStore(previous);
    }
  }
}
