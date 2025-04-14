import type { ServerConfig } from '@modern-js/server-core';

export {
  useHonoContext,
  type ServerPlugin,
  type ServerPluginLegacy,
  type MiddlewareObj,
  type Context,
  type Next,
  type MiddlewareHandler,
  type ServerConfig,
} from '@modern-js/server-core';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;
