import type { Readable } from 'node:stream';
import type {
  Metrics,
  Logger,
  Reporter,
  BaseSSRServerContext,
  ServerRoute,
  NestedRoute,
} from '@modern-js/types';

export type SSRServerContext = BaseSSRServerContext & {
  staticGenerate?: boolean;
};

export type ServerRender = (
  ssrContext: SSRServerContext,
) => Promise<string | Readable | ReadableStream>;

export type RequestHandler = (
  request: Request,
  ...args: any[]
) => Response | Promise<Response>;

type ServerLoaderBundle = {
  routes: NestedRoute[];
  handleRequest: (options: {
    request: Request;
    serverRoutes: ServerRoute[];
    context: any;
    routes: NestedRoute[];
  }) => Promise<any>;
};

type ServerRenderBundle = {
  serverRender: () => any;
};

export type ServerManifest = {
  loaderBundles?: Record<string, ServerLoaderBundle>;
  renderBundles?: Record<string, ServerRenderBundle>;
  loadableStats?: Record<string, any>;
  routeManifest?: Record<string, any>;
};

type ServerVariables = {
  logger: Logger;
  reporter?: Reporter;
  serverManifest?: ServerManifest;
  templates?: Record<string, string>;
  /**
   * Communicating with custom server hook & modern ssrContext.
   *
   * Produce by custom server.
   * Custom by ssrRuntime.
   */
  locals?: Record<string, any>;
  metrics?: Metrics;
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
