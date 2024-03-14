import {
  StartDevServerOptions as RsbuildStartDevServerOptions,
  getAddressUrls,
  debug,
  StartServerResult,
  RsbuildInstance,
  deepmerge,
  DevConfig,
  ServerConfig,
  mergeChainedOptions,
  isProd,
} from '@rsbuild/shared';
import type { Server, ModernDevServerOptionsNew } from '@modern-js/server';
import { type ModernServerOptions } from '@modern-js/prod-server';
import type { UniBuilderConfig, ToolsDevServerConfig } from '../types';

type ServerOptions = Partial<Omit<ModernDevServerOptionsNew, 'config'>> & {
  config?: Partial<ModernDevServerOptionsNew['config']>;
};

const getServerOptions = (
  builderConfig: UniBuilderConfig,
): ModernServerOptions['config'] => {
  return {
    output: {
      path: builderConfig.output?.distPath?.root,
      assetPrefix: builderConfig.output?.assetPrefix,
      distPath: builderConfig.output?.distPath,
    },
    source: {
      alias: {},
    },
    html: {},
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
  };
};

export const transformToRsbuildServerOptions = (
  dev: NonNullable<UniBuilderConfig['dev']>,
  devServer: ToolsDevServerConfig,
): {
  dev: DevConfig;
  server: ServerConfig;
} => {
  const { port, host, https, ...devConfig } = dev;

  const newDevServerConfig = mergeChainedOptions({
    defaults: {
      devMiddleware: {
        writeToDisk: (file: string) => !file.includes('.hot-update.'),
      },
      hot: dev?.hmr ?? true,
      liveReload: true,
      client: {
        path: '/webpack-hmr',
      },
    },
    options: devServer,
    mergeFn: deepmerge,
  });

  const rsbuildDev: DevConfig = {
    ...devConfig,
    writeToDisk: newDevServerConfig.devMiddleware?.writeToDisk,
    hmr: newDevServerConfig.hot,
    client: newDevServerConfig.client,
    liveReload: newDevServerConfig.liveReload,
  };

  // enable progress bar by default
  if (dev.progressBar === undefined) {
    rsbuildDev.progressBar = true;
  }

  if (newDevServerConfig.before?.length || newDevServerConfig.after?.length) {
    rsbuildDev.setupMiddlewares = [
      ...(newDevServerConfig.setupMiddlewares || []),
      middlewares => {
        // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
        middlewares.unshift(...(newDevServerConfig.before || []));

        middlewares.push(...(newDevServerConfig.after || []));
      },
    ];
  } else if (newDevServerConfig.setupMiddlewares) {
    rsbuildDev.setupMiddlewares = newDevServerConfig.setupMiddlewares;
  }

  const server: ServerConfig = isProd()
    ? {
        publicDir: false,
        htmlFallback: false,
      }
    : {
        publicDir: false,
        htmlFallback: false,
        compress: newDevServerConfig.compress,
        headers: newDevServerConfig.headers,
        historyApiFallback: newDevServerConfig.historyApiFallback,
        proxy: newDevServerConfig.proxy,
        port,
        host,
        https: https ? (https as ServerConfig['https']) : undefined,
      };

  return { dev: rsbuildDev, server };
};

const getDevServerOptions = async ({
  builderConfig,
  serverOptions,
}: {
  builderConfig: UniBuilderConfig;
  serverOptions: ServerOptions;
}): Promise<{
  config: ModernDevServerOptionsNew['config'];
}> => {
  const defaultConfig = getServerOptions(builderConfig);
  const config = serverOptions.config
    ? deepmerge(defaultConfig, serverOptions.config)
    : defaultConfig;

  return { config };
};

export type StartDevServerOptions = Omit<
  RsbuildStartDevServerOptions,
  // printURLs is not used in modern.js
  'printURLs'
> & {
  apiOnly?: boolean;
  serverOptions?: ServerOptions;
};

export type UniBuilderStartServerResult = Omit<StartServerResult, 'server'> & {
  server: Server;
};

export async function startDevServer(
  rsbuild: RsbuildInstance,
  options: StartDevServerOptions = {},
  builderConfig: UniBuilderConfig,
) {
  debug('create dev server');

  const { ServerForRsbuild } = await import('@modern-js/server');

  const rsbuildServer = await rsbuild.getServerAPIs(options);

  const { serverOptions = {} } = options;

  const { config } = await getDevServerOptions({
    builderConfig,
    serverOptions,
  });

  const compileMiddlewareAPI = options.apiOnly
    ? undefined
    : await rsbuildServer.startCompile();

  const rsbuildConfig = rsbuild.getRsbuildConfig();

  const https = serverOptions.dev?.https ?? rsbuildServer.config.https;

  const server = new ServerForRsbuild({
    pwd: rsbuild.context.rootPath,
    ...serverOptions,
    rsbuild,
    getMiddlewares: config =>
      rsbuildServer.getMiddlewares({
        compileMiddlewareAPI,
        // TODO: To be removed. should update all rsbuild config in parseCommonConfig stage
        overrides: config,
      }),
    dev: {
      watch: serverOptions.dev?.watch ?? true,
      compress: rsbuildConfig.server?.compress,
      https,
      devMiddleware: {
        writeToDisk: rsbuildConfig.dev?.writeToDisk,
      },
    },
    config,
  });

  const {
    config: { port, host },
  } = rsbuildServer;

  debug('create dev server done');

  await rsbuildServer.beforeStart();

  const protocol = https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

  debug('listen dev server');

  await server.init();

  return new Promise<UniBuilderStartServerResult>(resolve => {
    server.listen(
      {
        host,
        port,
      },
      async (err?: Error) => {
        if (err) {
          throw err;
        }

        debug('listen dev server done');

        await rsbuildServer.afterStart({
          port,
          routes: [
            {
              pathname: '/',
              entryName: 'index',
            },
          ],
        });

        resolve({
          port,
          urls: urls.map(item => item.url),
          server,
        });
      },
    );
  });
}
