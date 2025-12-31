import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { env } from 'node:process';
import type { ServerBase } from '@modern-js/server-core';
import {
  injectNodeSeverPlugin,
  injectResourcePlugin,
  injectRscManifestPlugin,
  loadCacheConfig,
  serverStaticPlugin,
} from '@modern-js/server-core/node';
import { isProd } from '@modern-js/utils';
import type { ProdServerOptions } from '../types';
import {
  applyPlugins as baseApplyPlugins,
  getLogger as baseGetLogger,
} from './base';

// Now we not use logger options, it can be implemented in the future
function getLogger(_?: boolean | Record<string, unknown>) {
  const setLevel = Boolean(env.DEBUG || env.NODE_ENV === 'production');
  return baseGetLogger(
    setLevel,
    (env.MODERN_SERVER_LOG_LEVEL as any) || 'verbose',
  );
}

export type ApplyPlugins = typeof applyPlugins;

export async function applyPlugins(
  serverBase: ServerBase,
  options: ProdServerOptions,
  nodeServer?: NodeServer | Http2SecureServer,
) {
  const { pwd, appContext, config, logger: optLogger, serverConfig } = options;

  const enableRsc = config.server?.rsc ?? serverConfig?.server?.rsc ?? false;

  const loadCachePwd = isProd() ? pwd : appContext.appDirectory || pwd;
  const cacheConfig = await loadCacheConfig(loadCachePwd);

  const loggerOptions = config.server.logger;
  const logger =
    loggerOptions === false ? false : optLogger || getLogger(loggerOptions);

  return baseApplyPlugins(serverBase, {
    ...options,
    logger,
    cacheConfig,
    beforePlugins: nodeServer ? [injectNodeSeverPlugin({ nodeServer })] : [],
    plugins: [
      ...(options.plugins || []),
      injectResourcePlugin(),
      injectRscManifestPlugin(enableRsc),
      serverStaticPlugin(),
    ],
  });
}
