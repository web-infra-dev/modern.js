import type { Readable } from 'node:stream';
import type {
  Metrics,
  Logger,
  Reporter,
  BaseSSRServerContext,
  ServerRoute,
  NestedRoute,
  Monitors,
} from '@modern-js/types';
import {
  RequestHandler as BundleRequestHandler,
  OnError,
  OnTiming,
} from './requestHandler';

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
    routes: NestedRoute[];
    context: {
      reporter?: Reporter;
    };

    onError?: OnError;
    onTiming?: OnTiming;
  }) => Promise<any>;
};

type ServerRenderBundle = {
  requestHandler: Promise<BundleRequestHandler>;
};

export type ServerManifest = {
  loaderBundles?: Record<string, ServerLoaderBundle>;
  renderBundles?: Record<string, ServerRenderBundle>;
  loadableStats?: Record<string, any>;
  routeManifest?: Record<string, any>;
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
  templates?: Record<string, string>;
  /**
   * Communicating with custom server hook & modern ssrContext.
   *
   * Produce by custom server.
   * Custom by ssrRuntime.
   */
  locals?: Record<string, any>;
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
