import { randomUUID } from 'node:crypto';
import type {
  Middleware,
  Render,
  ServerEnv,
  ServerManifest,
} from '../../types';
import {
  type SSRRequestCoordinatorOptions,
  type SSRRequestPolicyContext,
  type SSRUpdateScope,
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
  /** Identify the default route for an update-time policy decision. */
  resolvePolicyEntry?: (request: Request) => string | undefined;
  /** Release generation-owned adapters/state; must be safe to retry after failure. */
  dispose?: (
    resources: SSRApplicationResources | undefined,
    entries?: readonly string[],
  ) => Promise<void>;
  /** Opt into a recoverable, unavailable owner after an initial load failure. */
  onInitialError?: (error: unknown) => void;
  /** Resource readiness, including recovery without another local compilation. */
  onAvailabilityChange?: (available: boolean) => void;
  /** Must respond directly; bypass handlers cannot fall through into application code. */
  bypass?: (request: Request) => Promise<Response | undefined>;
  /** Synchronize before admission. A returned response bypasses all SSR/CSR work. */
  beforeRequest?: (request: Request) => Promise<void | Response>;
  /** Server-owned HTML fallback. It must not execute application bundles or loaders. */
  renderCSR?: (
    request: Request,
    context: SSRRequestPolicyContext & {
      templates: Readonly<Record<string, string>>;
      entryScope?: readonly string[];
    },
  ) => Response | Promise<Response>;
}

/** One process-local resource owner. Module invalidation belongs to its bundler adapter. */
export async function createSSRApplication(options: SSRApplicationOptions) {
  let resources: SSRApplicationResources | undefined;
  try {
    resources = await options.load(false);
  } catch (error) {
    if (!options.onInitialError) throw error;
    let failure = error;
    try {
      await options.dispose?.(undefined);
    } catch (cleanupError) {
      failure = new AggregateError(
        [error, cleanupError],
        'SSR initialization and cleanup failed',
      );
    }
    options.onInitialError(failure);
  }
  const coordinator = createSSRRequestCoordinator(
    options,
    resources ? 'serving' : 'unavailable',
  );
  options.onAvailabilityChange?.(Boolean(resources));
  let cacheNamespace = randomUUID();
  let entryNamespaces = new Map<string, string>();
  const middleware: Middleware<ServerEnv> = async (c, next) => {
    const bypass = await options.bypass?.(c.req.raw);
    if (bypass) return bypass;
    const beforeRequest = await options.beforeRequest?.(c.req.raw);
    if (beforeRequest) return beforeRequest;
    const scope = options.resolveScope?.(c.req.raw)?.slice();
    const response = await coordinator.handle(
      c.req.raw,
      async work => {
        if (!resources) throw new Error('SSR resources are unavailable');
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
        if (!c.finalized) {
          throw new Error(
            'Context is not finalized. Did you forget to return a Response object or await next()?',
          );
        }
        return c.res;
      },
      scope,
      options.renderCSR
        ? async context =>
            resources
              ? options.renderCSR!(c.req.raw, {
                  ...context,
                  // Keep the last published client release until a new generation
                  // is ready. No retiring SSR handler is entered for this response.
                  templates: resources.templates,
                  entryScope: scope,
                })
              : new Response('SSR application is unavailable', { status: 503 })
        : undefined,
      () => {
        // HTTP pools/timers may retain an ALS Context beyond its request lease.
        // Detach only our generation roots after all response/producer work ends.
        c.set('templates', undefined);
        c.set('serverManifest', undefined);
        c.set('ssrRender', undefined);
        c.set('ssrWork', undefined);
      },
      options.resolvePolicyEntry,
    );
    c.res = response;
    return response;
  };
  return {
    middleware,
    get status() {
      return coordinator.status;
    },
    /** Stop admission and drain work before the service releases its resources. */
    close() {
      return coordinator.close();
    },
    /** Submit control-plane work after this request's response and producers finish. */
    defer<T>(operation: () => Promise<T>) {
      return coordinator.defer(operation);
    },
    /** Let adapters enforce request boundaries before their own deduplication. */
    assertUpdateAllowed() {
      coordinator.assertUpdateAllowed();
    },
    /** Called only by the control plane; invalidate must detach/reset owned bundler state. */
    update(
      invalidate: (entries?: readonly string[]) => Promise<void>,
      entries?: readonly string[] | SSRUpdateScope,
    ) {
      if (typeof invalidate !== 'function')
        return Promise.reject(
          new TypeError('An owned module invalidator is required'),
        );
      options.onAvailabilityChange?.(false);
      return coordinator
        .update(
          async scope => {
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
          },
          entries,
          !options.resolveScope,
        )
        .finally(() => {
          options.onAvailabilityChange?.(
            coordinator.status.phase === 'serving',
          );
        });
    },
  };
}
export type SSRApplication = Awaited<ReturnType<typeof createSSRApplication>>;
