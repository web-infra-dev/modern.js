import {
  ErrorDigest,
  ServerBase,
  createErrorHtml,
  faviconPlugin,
  logPlugin,
  monitorPlugin,
  onError,
  processedByPlugin,
  renderPlugin,
} from '@modern-js/server-core';
import {
  bindBffPlugin,
  serverStaticPlugin,
  injectResourcePlugin,
  loadCacheConfig,
} from '@modern-js/server-core/node';
import { createLogger, isProd } from '@modern-js/utils';
import { ProdServerOptions } from './types';

function getLogger() {
  if (process.env.DEBUG || process.env.NODE_ENV === 'production') {
    return createLogger({ level: 'verbose' });
  } else {
    return createLogger();
  }
}

export type ApplyPlugins = typeof applyPlugins;

export async function applyPlugins(
  serverBase: ServerBase,
  options: ProdServerOptions,
) {
  const { pwd, routes, appContext } = options;

  const loadCachePwd = isProd() ? pwd : appContext.appDirectory || pwd;
  const cacheConfig = loadCacheConfig(loadCachePwd);

  serverBase.notFound(c => {
    const logger = c.get('logger');
    onError(logger, ErrorDigest.ENOTF, '404 not found', c.req.raw);
    return c.html(createErrorHtml(404), 404);
  });

  serverBase.onError((err, c) => {
    const logger = c.get('logger');
    onError(logger, ErrorDigest.EINTER, err, c.req.raw);
    return c.html(createErrorHtml(500), 500);
  });

  const plugins = [
    monitorPlugin({ logger: getLogger() }),
    processedByPlugin(),
    logPlugin(),
    injectResourcePlugin({
      pwd,
      routes,
    }),
    serverStaticPlugin(),
    faviconPlugin(),
    bindBffPlugin(),
    renderPlugin({
      staticGenerate: options.staticGenerate,
      cacheConfig,
    }),
  ];

  serverBase.addPlugins(plugins);
}
