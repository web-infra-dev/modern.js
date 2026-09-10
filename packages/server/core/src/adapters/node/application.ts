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
  load: (rebuilding: boolean) => Promise<SSRApplicationResources>;
  /** Release generation-owned adapters/state; must be safe to retry after failure. */
  dispose?: (resources: SSRApplicationResources) => Promise<void>;
  /** Must respond directly; bypass handlers cannot fall through into application code. */
  bypass?: (request: Request) => Promise<Response | undefined>;
}

/** One process-local resource owner. Module invalidation belongs to its bundler adapter. */
export async function createSSRApplication(options: SSRApplicationOptions) {
  const coordinator = createSSRRequestCoordinator(options);
  let resources = await options.load(false);
  let cacheNamespace = randomUUID();
  const middleware: Middleware<ServerEnv> = async (c, next) => {
    const bypass = await options.bypass?.(c.req.raw);
    if (bypass) return bypass;
    const response = await coordinator.handle(c.req.raw, async work => {
      // Admission must precede all resource selection, including captured promises.
      c.set('templates', resources.templates);
      c.set('serverManifest', resources.serverManifest);
      c.set('ssrRender', resources.render);
      c.set('ssrWork', work);
      c.set('ssrCacheNamespace', cacheNamespace);
      await next();
      return c.res;
    });
    c.res = response;
    return response;
  };
  return {
    middleware,
    get status() {
      return coordinator.status;
    },
    /** Called only by the control plane; invalidate must detach/reset owned bundler state. */
    update(invalidate: () => Promise<void>) {
      if (typeof invalidate !== 'function')
        return Promise.reject(
          new TypeError('An owned module invalidator is required'),
        );
      return coordinator.update(async () => {
        await invalidate();
        await options.dispose?.(resources);
        let candidate: SSRApplicationResources;
        try {
          candidate = await options.load(true);
        } catch (error) {
          // The owner must also release any adapters created by a failed load.
          try {
            await options.dispose?.(resources);
          } catch (cleanupError) {
            throw new AggregateError(
              [error, cleanupError],
              'SSR preparation and cleanup failed',
            );
          }
          throw error;
        }
        resources = candidate;
        cacheNamespace = randomUUID();
      });
    },
  };
}
export type SSRApplication = Awaited<ReturnType<typeof createSSRApplication>>;
