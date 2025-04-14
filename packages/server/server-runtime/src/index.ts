import type { ServerConfig } from '@modern-js/server-core';

export type {
  ServerPlugin,
  ServerPluginLegacy,
  MiddlewareObj,
  Context,
  Next,
  MiddlewareHandler,
} from '@modern-js/server-core';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;
