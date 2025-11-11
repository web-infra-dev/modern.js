import type { ServerConfig } from '@modern-js/server-core';

export {
  useHonoContext,
  type ServerPlugin,
  type MiddlewareObj,
  type Context,
  type Next,
  type MiddlewareHandler,
  type ServerConfig,
} from '@modern-js/server-core';

export * from '@modern-js/server-core/hono';

export type {
  Container,
  CacheControl,
  CacheOptionProvider,
  CacheOption,
  MonitorEvent,
  Monitors,
} from '@modern-js/types';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;
