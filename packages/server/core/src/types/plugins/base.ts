import type {
  IncomingMessage,
  Server as NodeServer,
  ServerResponse,
} from 'http';
import type {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'node:http2';
import type {
  CacheOption,
  Container,
  HttpMethodDecider,
  Logger,
  Metrics,
  MiddlewareContext,
  Reporter,
  ServerRoute,
  UnstableMiddleware,
} from '@modern-js/types';
import type { MiddlewareHandler } from 'hono';
import type { UserConfig } from '../config';
import type { Render } from '../render';
import type { ServerPlugin } from './new';
import type { ServerPluginLegacy } from './old';

export type { FileChangeEvent, ResetEvent } from '@modern-js/plugin-v2';
export type FallbackReason = 'error' | 'header' | 'query';

export type FallbackInput = {
  reason: FallbackReason;
  error: unknown;
  logger: Logger;
  metrics?: Metrics;
  reporter?: Reporter;
};

export type OnFallback = (
  reason: FallbackReason,
  utils: {
    logger: Logger;
    metrics?: Metrics;
    reporter?: Reporter;
  },
  error?: unknown,
) => Promise<void>;

export type APIServerStartInput = {
  pwd: string;
  prefix?: string;
  httpMethodDecider?: HttpMethodDecider;
  config?: {
    middleware?: Array<any>;
  };
  render?: Render | null;
};

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

export type WebAdapter = (ctx: MiddlewareContext) => void | Promise<void>;

/** Plugin Api */
type MiddlewareOrder = 'pre' | 'post' | 'default';

export type Middleware = {
  name: string;

  path?: string;

  method?: 'options' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all';

  handler: MiddlewareHandler | MiddlewareHandler[];

  before?: Array<Middleware['name']>;

  order?: MiddlewareOrder;
};

export type ServerMiddleware = Middleware;

export interface GetRenderHandlerOptions {
  pwd: string;
  routes: ServerRoute[];
  config: UserConfig;
  onFallback?: OnFallback;
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
  metaName?: string;
}

declare module '@modern-js/types' {
  export interface ISAppContext {
    middlewares: Middleware[];
    metaName: string;

    getRenderOptions?: GetRenderHandlerOptions;
    render?: Render;
    routes?: ServerRoute[];
    nodeServer?: NodeServer | Http2SecureServer;
  }
}

export type CacheConfig = {
  strategy: CacheOption;
  container?: Container;
};

type RenderMiddleware = UnstableMiddleware;

export interface RenderConfig {
  cache?: CacheConfig;
  middleware?: RenderMiddleware[];
}

export type ServerConfig = {
  render?: RenderConfig;
  plugins?: (ServerPlugin | ServerPluginLegacy)[];
} & UserConfig;
