import {
  ErrorDigest,
  type NodeServer,
  type ServerBase,
  createDefaultPlugins,
  createErrorHtml,
  faviconPlugin,
  onError,
  renderPlugin,
} from '@modern-js/server-core';
import {
  injectNodeSeverPlugin,
  injectResourcePlugin,
  injectRscManifestPlugin,
  loadCacheConfig,
  serverStaticPlugin,
} from '@modern-js/server-core/node';
import { createLogger, isProd } from '@modern-js/utils';
import type { ProdServerOptions } from './types';

// Now we not use logger options, it can be implemented in the future
function getLogger(_?: boolean | Record<string, unknown>) {
  if (process.env.DEBUG || process.env.NODE_ENV === 'production') {
    return createLogger({
      level: (process.env.MODERN_SERVER_LOG_LEVEL as any) || 'verbose',
    });
  } else {
    return createLogger();
  }
}

export type ApplyPlugins = typeof applyPlugins;

export async function applyPlugins(
  serverBase: ServerBase,
  options: ProdServerOptions,
  nodeServer?: NodeServer,
) {
  const { pwd, appContext, config } = options;

  const loadCachePwd = isProd() ? pwd : appContext.appDirectory || pwd;
  const cacheConfig = await loadCacheConfig(loadCachePwd);

  serverBase.notFound(c => {
    const monitors = c.get('monitors');
    onError(ErrorDigest.ENOTF, '404 not found', monitors, c.req.raw);
    return c.html(createErrorHtml(404), 404);
  });

  serverBase.onError((err, c) => {
    const monitors = c.get('monitors');
    onError(ErrorDigest.EINTER, err, monitors, c.req.raw);
    return c.html(createErrorHtml(500), 500);
  });

  const loggerOptions = config.server.logger;
  const plugins = [
    ...(nodeServer ? [injectNodeSeverPlugin({ nodeServer })] : []),
    ...createDefaultPlugins({
      cacheConfig,
      staticGenerate: options.staticGenerate,
      logger: loggerOptions === false ? false : getLogger(loggerOptions),
    }),
    ...(options.plugins || []),
    injectResourcePlugin(),
    injectRscManifestPlugin(),
    serverStaticPlugin(),
    faviconPlugin(),
    renderPlugin(),
  ];

  serverBase.addPlugins(plugins);
}
