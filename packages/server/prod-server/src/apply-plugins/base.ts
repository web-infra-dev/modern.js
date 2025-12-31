import {
  type CacheConfig,
  ErrorDigest,
  type ServerBase,
  type ServerPlugin,
  createDefaultPlugins,
  createErrorHtml,
  faviconPlugin,
  injectConfigMiddlewarePlugin,
  onError,
  renderPlugin,
} from '@modern-js/server-core';
import { createLogger, logger } from '@modern-js/utils';
import type { ProdServerOptions } from '../types';

// Now we not use logger options, it can be implemented in the future
type LogLevel = NonNullable<Parameters<typeof createLogger>[0]>['level'];
export function getLogger(setLevel = false, level: LogLevel = 'verbose') {
  if (setLevel) {
    return createLogger({
      level,
    });
  } else {
    return createLogger();
  }
}

export type ApplyPlugins = typeof applyPlugins;
interface ApplyPluginOptions extends ProdServerOptions {
  beforePlugins?: ServerPlugin[];
  cacheConfig?: CacheConfig;
}

export async function applyPlugins(
  serverBase: ServerBase,
  options: ApplyPluginOptions,
) {
  const { config, logger: optLogger, cacheConfig } = options;

  const serverErrorHandler = options.serverConfig?.onError;

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
  const { middlewares, renderMiddlewares } = options.serverConfig || {};

  const plugins = [
    ...(options.beforePlugins || []),
    ...createDefaultPlugins({
      cacheConfig,
      staticGenerate: options.staticGenerate,
      logger: loggerOptions === false ? false : optLogger || getLogger(),
    }),
    injectConfigMiddlewarePlugin(middlewares, renderMiddlewares),
    ...(options.plugins || []),
    faviconPlugin(),
    renderPlugin(),
  ];
  serverBase.addPlugins(plugins);
}
