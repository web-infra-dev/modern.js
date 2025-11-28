import type {
  CacheOption,
  Container,
  HttpMethodDecider,
  Logger,
  Metrics,
  MiddlewareContext,
  Reporter,
  ServerRoute,
} from '@modern-js/types';
import type { Context, MiddlewareHandler } from 'hono';
import type { UserConfig } from '../config';
import type { Render } from '../render';
import type { ServerPlugin } from './plugin';

export type { FileChangeEvent, ResetEvent } from '@modern-js/plugin';
export type FallbackReason = 'error' | 'header' | 'query' | `header,${string}`;

export type FallbackInput = {
  reason: FallbackReason;
  error: unknown;
};

export type OnFallback = (
  reason: FallbackReason,
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

export type MiddlewareObj = {
  name: string;

  path?: string;

  method?: 'options' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all';

  handler: MiddlewareHandler | MiddlewareHandler[];

  before?: Array<MiddlewareObj['name']>;

  order?: MiddlewareOrder;
};

export type ServerMiddleware = MiddlewareObj;

export interface GetRenderHandlerOptions {
  pwd: string;
  routes: ServerRoute[];
  config: UserConfig;
  onFallback?: OnFallback;
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
  metaName?: string;
}

export type CacheConfig = {
  strategy: CacheOption;
  container?: Container;
};

export type ServerErrorHandler = (err: Error, c: Context) => Promise<any> | any;

export type ServerConfig = {
  // TODO: Middleware need more env
  renderMiddlewares?: MiddlewareObj[];
  middlewares?: MiddlewareObj[];
  plugins?: ServerPlugin[];
  onError?: ServerErrorHandler;
} & UserConfig;
