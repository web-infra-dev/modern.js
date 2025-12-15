import type {
  CacheConfig,
  ServerBase,
  ServerPlugin,
} from '@modern-js/server-core';
import {
  createCacheContainer,
  injectResourcePlugin,
  loadDeps,
} from '@modern-js/server-core/edge-function';
import { createLogger } from '@modern-js/utils';
import type { ProdServerOptions } from '../types';
import { applyPlugins as baseApplyPlugins } from './base';

// Now we not use logger options, it can be implemented in the future
function getLogger(
  _?: boolean | Record<string, unknown>,
  env: Record<string, unknown> = {},
) {
  if (env.DEBUG || env.NODE_ENV === 'production') {
    return createLogger({
      level: (env.MODERN_SERVER_LOG_LEVEL as any) || 'verbose',
    });
  } else {
    return createLogger();
  }
}

export type ApplyPlugins = typeof applyPlugins;

export async function applyPlugins(
  serverBase: ServerBase,
  options: ProdServerOptions,
  deps: any,
  env?: Record<string, unknown>,
  plugins?: ServerPlugin[],
) {
  const { config, logger: optLogger } = options;

  const cacheConfig: CacheConfig = {
    strategy: loadDeps(['server', 'cache'], deps)?.content,
    container: await createCacheContainer('MODERN_SERVER_CACHE'),
  };

  const loggerOptions = config.server.logger;
  const logger =
    loggerOptions === false
      ? false
      : optLogger || getLogger(loggerOptions, env);

  return baseApplyPlugins(serverBase, {
    ...options,
    logger,
    cacheConfig,
    beforePlugins: [],
    plugins: [
      ...(options.plugins || []),
      injectResourcePlugin(deps),
      // injectRscManifestPlugin(deps),
      ...(plugins || []),
    ],
  });
}
