import { randomUUID } from 'node:crypto';
import type {
  Middleware,
  Render,
  ServerEnv,
  ServerManifest,
} from '../../types';
import {
  type SSRRequestCoordinatorOptions,
  createSSRRequestCoordinator,
} from './requestCoordinator';

export interface SSRApplicationResources {
  templates: Record<string, string>;
  serverManifest: ServerManifest;
  render: Render;
}

export interface SSRApplicationOptions extends SSRRequestCoordinatorOptions {
  load: (
    rebuilding: boolean,
    entries?: readonly string[],
  ) => Promise<SSRApplicationResources>;
  /** Owned adapters may opt into entry isolation; unknown requests use the whole application. */
  resolveScope?: (request: Request) => readonly string[] | undefined;
  /** Release generation-owned adapters/state; must be safe to retry after failure. */
  dispose?: (
    resources: SSRApplicationResources,
    entries?: readonly string[],
  ) => Promise<void>;
  /** Must respond directly; bypass handlers cannot fall through into application code. */
  bypass?: (request: Request) => Promise<Response | undefined>;
}

/** One process-local resource owner. Module invalidation belongs to its bundler adapter. */
export async function createSSRApplication(options: SSRApplicationOptions) {
  const coordinator = createSSRRequestCoordinator(options);
  let resources = await options.load(false);
  let cacheNamespace = randomUUID();
  let entryNamespaces = new Map<string, string>();
  const middleware: Middleware<ServerEnv> = async (c, next) => {
    const bypass = await options.bypass?.(c.req.raw);
    if (bypass) return bypass;
    const scope = options.resolveScope?.(c.req.raw)?.slice();
    const response = await coordinator.handle(
      c.req.raw,
      async work => {
        if (scope?.length === 1 && !entryNamespaces.has(scope[0]))
          entryNamespaces.set(scope[0], cacheNamespace);
        // Admission must precede all resource selection, including captured promises.
        c.set('templates', resources.templates);
        c.set('serverManifest', resources.serverManifest);
        const render = resources.render;
        c.set('ssrRender', (request, renderOptions) =>
          render(request, { ...renderOptions, entryScope: scope }),
        );
        c.set('ssrWork', work);
        c.set(
          'ssrCacheNamespace',
          scope?.length === 1
            ? entryNamespaces.get(scope[0]) || cacheNamespace
            : cacheNamespace,
        );
        await next();
        return c.res;
      },
      scope,
    );
    c.res = response;
    return response;
  };
  return {
    middleware,
    get status() {
      return coordinator.status;
    },
    /** Called only by the control plane; invalidate must detach/reset owned bundler state. */
    update(
      invalidate: (entries?: readonly string[]) => Promise<void>,
      entries?: readonly string[] | (() => readonly string[] | undefined),
    ) {
      if (entries && !options.resolveScope)
        return Promise.reject(
          new Error(
            'Scoped SSR updates require an owned request scope resolver',
          ),
        );
      if (typeof invalidate !== 'function')
        return Promise.reject(
          new TypeError('An owned module invalidator is required'),
        );
      return coordinator.update(async scope => {
        await invalidate(scope);
        await options.dispose?.(resources, scope);
        let candidate: SSRApplicationResources;
        try {
          candidate = await options.load(true, scope);
        } catch (error) {
          // The owner must also release any adapters created by a failed load.
          try {
            await options.dispose?.(resources, scope);
          } catch (cleanupError) {
            throw new AggregateError(
              [error, cleanupError],
              'SSR preparation and cleanup failed',
            );
          }
          throw error;
        }
        resources = candidate;
        if (scope) {
          const next = new Map(entryNamespaces);
          for (const entry of scope) next.set(entry, randomUUID());
          entryNamespaces = next;
          cacheNamespace = randomUUID();
        } else {
          cacheNamespace = randomUUID();
          entryNamespaces = new Map();
        }
      }, entries);
    },
  };
}
export type SSRApplication = Awaited<ReturnType<typeof createSSRApplication>>;
