import type { Server as NodeServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import {
  ErrorDigest,
  type ServerBase,
  createDefaultPlugins,
  createErrorHtml,
  faviconPlugin,
  injectConfigMiddlewarePlugin,
  onError,
  renderPlugin,
  routerRewritePlugin,
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
  nodeServer?: NodeServer | Http2SecureServer,
) {
  const { pwd, appContext, config, logger: optLogger } = options;

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
  const { middlewares, renderMiddlewares } = options.serverConfig || {};

  const plugins = [
    routerRewritePlugin(),
    ...(nodeServer ? [injectNodeSeverPlugin({ nodeServer })] : []),
    ...createDefaultPlugins({
      cacheConfig,
      staticGenerate: options.staticGenerate,
      logger:
        loggerOptions === false ? false : optLogger || getLogger(loggerOptions),
    }),
    injectConfigMiddlewarePlugin(middlewares, renderMiddlewares),
    ...(options.plugins || []),
    injectResourcePlugin(),
    injectRscManifestPlugin(),
    serverStaticPlugin(),
    faviconPlugin(),
    renderPlugin(),
  ];
  serverBase.addPlugins(plugins);
}
