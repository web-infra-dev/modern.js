import type { Readable } from 'node:stream';
import type {
  Logger,
  Metrics,
  Monitors,
  NestedRoute,
  Reporter,
  ServerRoute,
} from '@modern-js/types';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type {
  RequestHandler as BundleRequestHandler,
  OnError,
  OnTiming,
} from './requestHandler';

export type RequestHandler = (
  request: Request,
  ...args: any[]
) => Response | Promise<Response>;

type ServerLoaderBundle = {
  routes: NestedRoute[];
  handleRequest: (options: {
    request: Request;
    serverRoutes: ServerRoute[];
    routes: NestedRoute[];
    context: {
      reporter?: Reporter;
      loaderContext?: Map<string, unknown>;
    };

    onError?: OnError;
    onTiming?: OnTiming;
  }) => Promise<any>;
};

type ServerRenderBundle = {
  requestHandler?: Promise<BundleRequestHandler>;
  handleAction?: (
    req: Request,
    options: { clientManifest: RscClientManifest },
  ) => Promise<Response>;
  renderRscHandler?: (options: {
    clientManifest: RscClientManifest;
  }) => Promise<Response>;
};

export type ServerManifest = {
  loaderBundles?: Record<string, ServerLoaderBundle>;
  renderBundles?: Record<string, ServerRenderBundle>;
  loadableStats?: Record<string, any>;
  routeManifest?: Record<string, any>;
  nestedRoutesJson?: Record<string, any>;
};

type ServerVariables = {
  /** @deprecated  */
  logger: Logger;

  /** @deprecated  */
  reporter?: Reporter;

  /** @deprecated  */
  metrics?: Metrics;

  monitors: Monitors;

  serverManifest?: ServerManifest;

  rscServerManifest?: RscServerManifest;

  rscClientManifest?: RscClientManifest;

  rscSSRManifest?: RscSSRManifest;

  templates?: Record<string, string>;

  matchPathname?: string;

  matchEntryName?: string;
  /**
   * Communicating with custom server hook & modern ssrContext.
   *
   * Produce by custom server.
   * Custom by ssrRuntime.
   */
  locals?: Record<string, any>;

  /**
   * The current matched route, now only expose entryName field.
   */
  route: Required<Pick<ServerRoute, 'entryName'>>;
};

export type ServerEnv = {
  Variables: ServerVariables;
};

export type {
  Context,
  Env,
  HonoRequest,
  Next,
  MiddlewareHandler as Middleware,
} from 'hono';
