import { createServer, Server } from 'http';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { createSecureServer } from 'http2';
import { promisify } from 'util';
import Koa from 'koa';
import koaStatic from 'koa-static';
import koaCors from '@koa/cors';
import c2k from 'koa-connect';
import type { Plugin as RollupPlugin } from 'rollup';
import {
  chalk,
  FSWatcher,
  HMR_SOCK_PATH,
  isTypescript,
  prettyInstructions,
  clearConsole,
  getPackageManager,
} from '@modern-js/utils';
import type { IAppContext, NormalizedConfig, PluginAPI } from '@modern-js/core';
// FIXME: 很奇怪，换了名字之后就可以编译通过了，可能 `macro` 这个名字有啥特殊的含义？
import { macrosPlugin } from './plugins/_macro';
import { launchEditorMiddleware } from './middlewares/launch-editor';
import { assetsPlugin } from './plugins/assets';
import { transformMiddleware } from './middlewares/transform';
import { WebSocketServer, onFileChange } from './websocket-server';
import {
  DEFAULT_DEPS,
  DEFAULT_PDN_HOST,
  HOST,
  MODERN_JS_INTERNAL_PACKAGES,
  VIRTUAL_DEPS_MAP,
} from './constants';
import { optimizeDeps } from './install/local-optimize';
import {
  getBFFMiddleware,
  setIgnoreDependencies,
  shouldEnableBabelMacros,
  shouldUseBff,
} from './utils';
import { historyApiFallbackMiddleware } from './middlewares/history-api-fallback';
import { notFoundMiddleware } from './middlewares/not-found';
import { aliasPlugin, tsAliasPlugin } from './plugins/alias';
import { esbuildPlugin } from './plugins/esbuild';
import { hmrPlugin } from './plugins/hmr';
import { jsonPlugin } from './plugins/json';
import { resolvePlugin } from './plugins/resolve';
import { definePlugin } from './plugins/define';
import { cssPlugin } from './plugins/css';
import { createPluginContainer, PluginContainer } from './plugins/container';
import { importRewritePlugin } from './plugins/import-rewrite';
import { proxyMiddleware } from './middlewares/proxy';
import { fastRefreshPlugin } from './plugins/fast-refresh';
import { errorOverlayMiddleware } from './middlewares/error-overlay';
import { lazyImportPlugin } from './plugins/lazy-import';
import { startTimer } from './dev';
import { fsWatcher } from './watcher';
import { lambdaApiPlugin } from './plugins/lambda-api';
import { UnbundleDependencies } from './hooks';

export interface ESMServer {
  https: boolean;
  appDirectory: string;
  config: NormalizedConfig;
  httpServer: Server;
  wsServer: WebSocketServer;
  watcher: FSWatcher;
  pluginContainer: PluginContainer;
  closeServer: () => Promise<void>;
}

export const createDevServer = async (
  config: NormalizedConfig,
  appContext: IAppContext,
  dependencies: UnbundleDependencies,
): Promise<ESMServer> => {
  const { appDirectory, internalDirectory } = appContext;
  const { https } = config.dev || {};
  const { disableAutoImportStyle } = config.output || {};

  const app = new Koa();

  const httpServer = https
    ? await createHttpsServer(app)
    : createServer(app.callback());

  const wsServer = new WebSocketServer(httpServer, HMR_SOCK_PATH);

  const watcher = fsWatcher.init(appDirectory, internalDirectory);

  const pluginContainer = await createPluginContainer(
    [
      aliasPlugin(config, appContext, dependencies.defaultDeps),
      isTypescript(appDirectory) && tsAliasPlugin(config, appContext),
      assetsPlugin(config, appContext),
      shouldUseBff(appDirectory) && lambdaApiPlugin(config, appContext),
      esbuildPlugin(config, appContext),
      shouldEnableBabelMacros(appDirectory) && macrosPlugin(config),
      !disableAutoImportStyle && lazyImportPlugin(),
      resolvePlugin(config, appContext),
      definePlugin(config),
      jsonPlugin(config),
      cssPlugin(config, appContext, dependencies.defaultDeps),
      importRewritePlugin(config, appContext, wsServer),
      fastRefreshPlugin(),
      hmrPlugin(config, appContext),
    ].filter(Boolean) as RollupPlugin[],
    config,
    appContext,
  );

  const server: ESMServer = {
    https: https!,
    appDirectory,
    config,
    httpServer,
    wsServer,
    watcher,
    pluginContainer,
    closeServer: async () => {
      const httpServerClosePromise = new Promise<void>((resolve, reject) => {
        httpServer.close(err => {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        });
      });
      const wsServerClosePromise = wsServer.close();
      const fileWatcherClosePromise = watcher.close();
      pluginContainer.closeWatcher();
      await Promise.all([
        httpServerClosePromise,
        wsServerClosePromise,
        fileWatcherClosePromise,
      ]);
    },
  };

  watcher.on('change', filename => onFileChange(server, filename));

  // keep it at the beginning of the middleware chain to catch internal error
  app.use(errorOverlayMiddleware(server));

  app.use(launchEditorMiddleware());

  proxyMiddleware(config, appContext).map(middleware =>
    app.use(c2k(middleware)),
  );

  app.use(koaCors({ origin: '*' }));

  app.use(transformMiddleware(config, appContext, pluginContainer));

  // history api fallback to specific html
  app.use(historyApiFallbackMiddleware(config, appContext));

  app.use(
    koaStatic('/', {
      index: false,
      hidden: true,
    }),
  );

  app.use(
    koaStatic(appDirectory, {
      index: false,
      hidden: true,
    }),
  );

  if (shouldUseBff(appDirectory)) {
    const handler = await getBFFMiddleware(config, appContext);
    app.use(async (ctx, next) => {
      const promisifyHandler = promisify(callback => {
        handler(ctx.req, ctx.res, callback as () => void);
      });
      await promisifyHandler();
      await next();
    });
  }

  // handle 404
  app.use(notFoundMiddleware());

  return server;
};

export const startDevServer = async (
  api: PluginAPI,
  userConfig: NormalizedConfig,
  appContext: IAppContext,
) => {
  const { port } = userConfig.server;

  // TODO: bff
  // await setupBFFAPI(userConfig, api, port);

  const hookRunners = api.useHookRunners();
  const dependencies = await hookRunners.unbundleDependencies({
    defaultDeps: DEFAULT_DEPS,
    internalPackages: MODERN_JS_INTERNAL_PACKAGES,
    virtualDeps: VIRTUAL_DEPS_MAP,
    defaultPdnHost: DEFAULT_PDN_HOST,
  });

  setIgnoreDependencies(userConfig, dependencies.virtualDeps);

  const { httpServer, pluginContainer, closeServer } = await createDevServer(
    userConfig,
    appContext,
    dependencies,
  );

  await pluginContainer.buildStart({});

  await optimizeDeps({
    userConfig,
    appContext,
    dependencies,
  });

  const packageManager = await getPackageManager(appContext.appDirectory);

  httpServer.listen(port, HOST, () => {
    startTimer.end = Date.now();

    clearConsole();
    // eslint-disable-next-line no-console
    console.log(
      chalk.greenBright(
        `Unbundle mode ready in ${startTimer.end - startTimer.start}ms\n`,
      ),
    );

    let message = prettyInstructions(appContext, userConfig);

    message += `\n${chalk.cyanBright(
      [
        `Note that unbundle mode require native ESM dynamic import support.`,
        `To dev for legacy browsers, use ${packageManager} run dev.`,
      ].join('\n'),
    )}`;

    // eslint-disable-next-line no-console
    console.log(message);
  });

  return closeServer;
};

const createHttpsServer = async (app: Koa): Promise<Server> => {
  const { key, cert } = await require('devcert').certificateFor('localhost');

  return createSecureServer(
    {
      key,
      cert,
      allowHTTP1: true,
    },
    app.callback(),
  ) as any;
};
