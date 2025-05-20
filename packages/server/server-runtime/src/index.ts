import type { ServerConfig } from '@modern-js/server-core';

export type {
  ServerPlugin,
  ServerPluginLegacy,
  MiddlewareObj,
  Context,
  Next,
  MiddlewareHandler,
  ServerConfig,
} from '@modern-js/server-core';

export { useHonoContext } from '@modern-js/server-core/node';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;
