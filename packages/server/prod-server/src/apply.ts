import {
  ErrorDigest,
  ServerBase,
  createErrorHtml,
  onError,
  renderPlugin,
  NodeServer,
  createDefaultPlugins,
} from '@modern-js/server-core';
import {
  serverStaticPlugin,
  injectResourcePlugin,
  loadCacheConfig,
  injectNodeSeverPlugin,
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
  nodeServer?: NodeServer,
) {
  const { pwd, appContext } = options;

  const loadCachePwd = isProd() ? pwd : appContext.appDirectory || pwd;
  const cacheConfig = loadCacheConfig(loadCachePwd);

  serverBase.notFound(c => {
    const logger = c.get('logger');
    onError(ErrorDigest.ENOTF, '404 not found', logger, c.req.raw);
    return c.html(createErrorHtml(404), 404);
  });

  serverBase.onError((err, c) => {
    const logger = c.get('logger');
    onError(ErrorDigest.EINTER, err, logger, c.req.raw);
    return c.html(createErrorHtml(500), 500);
  });

  const plugins = [
    ...(nodeServer ? [injectNodeSeverPlugin({ nodeServer })] : []),
    ...createDefaultPlugins({
      cacheConfig,
      staticGenerate: options.staticGenerate,
      logger: getLogger(),
    }),
    ...(options.plugins || []),
    injectResourcePlugin(),
    serverStaticPlugin(),
    renderPlugin(),
  ];

  serverBase.addPlugins(plugins);
}
