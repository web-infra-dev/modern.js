/**
 * Deferred loader data for string SSR.
 *
 * A loader may return an object whose values are promises. Stream SSR streams each value
 * when it settles. String SSR sends the whole HTML at once, so before rendering the server
 * waits for those promises, up to `ssr.deferredDataTimeout` ms:
 * - values that resolve in time are rendered and serialized like plain data,
 * - values still pending (or rejected) are left out of `_ROUTER_DATA` and listed in
 *   `deferredPending`; the server renders their `<Await>` fallback.
 * In the browser each listed value becomes a promise fed by one extra call to that route's
 * loader, so only the regions that use it render later. The rest of the page hydrates
 * with the server data, instead of the whole page falling back to client rendering.
 */

/** Route id -> keys of its loader data that the browser has to load. */
export type DeferredPending = Record<string, string[]>;

const pendingByContext = new WeakMap<object, DeferredPending>();

/** Remember the pending keys of a static handler context until its data is serialized. */
export const setDeferredPending = (
  routerContext: object,
  pending: DeferredPending,
): void => {
  pendingByContext.set(routerContext, pending);
};

export const getDeferredPending = (
  routerContext: object,
): DeferredPending | undefined => pendingByContext.get(routerContext);

type LoaderData = Record<string, unknown>;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as PromiseLike<unknown>).then === 'function';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const PENDING = Symbol('pending');

/**
 * Wait for the promises in each route's loader data, at most `timeout` ms in total.
 * Settled values replace their promise in place. Returns the keys that did not resolve.
 */
export const settleDeferredLoaderData = async (
  loaderData: LoaderData,
  timeout?: number,
): Promise<DeferredPending> => {
  const entries: {
    routeId: string;
    key: string;
    promise: PromiseLike<unknown>;
  }[] = [];
  for (const [routeId, data] of Object.entries(loaderData)) {
    if (!isPlainObject(data)) {
      continue;
    }
    for (const [key, value] of Object.entries(data)) {
      if (isThenable(value)) {
        entries.push({ routeId, key, promise: value });
      }
    }
  }
  if (entries.length === 0) {
    return {};
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline =
    typeof timeout === 'number' && timeout >= 0
      ? new Promise<typeof PENDING>(resolve => {
          timer = setTimeout(() => resolve(PENDING), timeout);
        })
      : null;

  const outcomes = await Promise.all(
    entries.map(({ promise }) => {
      const settled = Promise.resolve(promise).then(
        value => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      );
      return deadline ? Promise.race([settled, deadline]) : settled;
    }),
  );
  if (timer) {
    clearTimeout(timer);
  }

  const pending: DeferredPending = {};
  outcomes.forEach((outcome, index) => {
    const { routeId, key } = entries[index];
    if (outcome !== PENDING && outcome.ok) {
      (loaderData[routeId] as Record<string, unknown>)[key] = outcome.value;
      return;
    }
    (pending[routeId] ||= []).push(key);
  });
  return pending;
};

/** Copy of the loader data without the values that are listed as pending. */
export const omitDeferredPending = (
  loaderData: LoaderData,
  pending: DeferredPending,
): LoaderData => {
  const routeIds = Object.keys(pending);
  if (routeIds.length === 0) {
    return loaderData;
  }
  const result: LoaderData = { ...loaderData };
  for (const routeId of routeIds) {
    const data = result[routeId];
    if (!isPlainObject(data)) {
      continue;
    }
    const copy = { ...data };
    for (const key of pending[routeId]) {
      delete copy[key];
    }
    result[routeId] = copy;
  }
  return result;
};

interface RouteLike {
  id?: string;
  loader?: unknown;
  children?: RouteLike[];
}

type LoaderFn = (args: {
  request: Request;
  params: Record<string, string | undefined>;
  context?: unknown;
}) => unknown;

const findRoute = (routes: RouteLike[], id: string): RouteLike | undefined => {
  for (const route of routes) {
    if (route.id === id) {
      return route;
    }
    const child = route.children && findRoute(route.children, id);
    if (child) {
      return child;
    }
  }
  return undefined;
};

/**
 * Browser side: put a promise in the hydration data for every pending value. All values
 * of one route share one call to that route's loader (for `.data.ts` loaders this is the
 * usual request to the server).
 */
export const restoreDeferredPending = (
  loaderData: LoaderData,
  pending: DeferredPending | undefined,
  routes: RouteLike[],
  options: {
    url: string;
    params: (routeId: string) => Record<string, string | undefined>;
  },
): LoaderData => {
  if (!pending || Object.keys(pending).length === 0) {
    return loaderData;
  }
  const result: LoaderData = { ...loaderData };
  for (const [routeId, keys] of Object.entries(pending)) {
    const route = findRoute(routes, routeId);
    let request: Promise<Record<string, unknown>> | undefined;
    const load = () => {
      if (!request) {
        request = (async () => {
          if (typeof route?.loader !== 'function') {
            throw new Error(
              `[modern-js] deferred data of route "${routeId}" has no loader to load it in the browser`,
            );
          }
          const data = await (route.loader as LoaderFn)({
            request: new Request(options.url),
            params: options.params(routeId),
          });
          if (data instanceof Response) {
            throw new Error(
              `[modern-js] loader of route "${routeId}" returned a Response while loading deferred data`,
            );
          }
          return (data || {}) as Record<string, unknown>;
        })();
      }
      return request;
    };
    const current = result[routeId];
    const data = isPlainObject(current) ? { ...current } : {};
    for (const key of keys) {
      const promise = load().then(values => values[key]);
      // An unconsumed rejection must not surface as an unhandled error.
      promise.catch(() => undefined);
      data[key] = promise;
    }
    result[routeId] = data;
  }
  return result;
};
