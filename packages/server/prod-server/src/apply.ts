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
} from '@modern-js/server-core';
import {
  injectNodeSeverPlugin,
  injectResourcePlugin,
  injectRscManifestPlugin,
  loadBundledCacheConfig,
  loadCacheConfig,
  serverStaticPlugin,
} from '@modern-js/server-core/node';
import { createLogger, isProd, logger } from '@modern-js/utils';
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

export type ExtraApplyConfig = Partial<{
  nodeServer: NodeServer | Http2SecureServer;
  noStaticServer: boolean;
}>;

export async function applyPlugins(
  serverBase: ServerBase,
  serverOptions: ProdServerOptions,
  extra: ExtraApplyConfig = {},
) {
  const {
    pwd,
    appContext,
    config,
    logger: optLogger,
    serverConfig,
  } = serverOptions;

  const enableRsc = config.server?.rsc ?? serverConfig?.server?.rsc ?? false;

  const serverErrorHandler = serverOptions.serverConfig?.onError;
  const cacheConfig = await (process.env.MODERN_SERVER_BUNDLE
    ? loadBundledCacheConfig(serverOptions.appContext?.dependencies)
    : loadCacheConfig(isProd() ? pwd : appContext.appDirectory || pwd));

  serverBase.notFound(c => {
    const monitors = c.get('monitors');
    onError(ErrorDigest.ENOTF, '404 not found', monitors, c.req.raw);
    return c.html(createErrorHtml(404), 404);
  });

  serverBase.onError(async (err, c) => {
    const monitors = c.get('monitors');
    onError(ErrorDigest.EINTER, err, monitors, c.req.raw);

    if (serverErrorHandler) {
      try {
        const result = await serverErrorHandler(err, c);
        if (result instanceof Response) {
          return result;
        }
      } catch (configError) {
        logger.error(`Error in serverConfig.onError handler: ${configError}`);
      }
    }
    const bffPrefix = config.bff?.prefix || '/api';
    const isApiPath = c.req.path.startsWith(bffPrefix);

    if (isApiPath) {
      return c.json(
        {
          message: (err as any)?.message || '[BFF] Internal Server Error',
        },
        (err as any)?.status || 500,
      );
    } else {
      return c.html(createErrorHtml(500), 500);
    }
  });

  const loggerOptions = config.server.logger;
  const { middlewares, renderMiddlewares } = serverOptions.serverConfig || {};

  const plugins = [
    ...(extra.nodeServer
      ? [injectNodeSeverPlugin({ nodeServer: extra.nodeServer })]
      : []),
    ...createDefaultPlugins({
      cacheConfig,
      staticGenerate: serverOptions.staticGenerate,
      logger:
        loggerOptions === false ? false : optLogger || getLogger(loggerOptions),
    }),
    injectConfigMiddlewarePlugin(middlewares, renderMiddlewares),
    ...(serverOptions.plugins || []),
    injectResourcePlugin(),
    injectRscManifestPlugin(enableRsc),
    ...(extra.noStaticServer ? [] : [serverStaticPlugin()]),
    faviconPlugin(),
    renderPlugin(),
  ];

  serverBase.addPlugins(plugins);
}
