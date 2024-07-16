import { merge } from 'ts-deepmerge';
import { applyOptionsChain, isProd } from '@modern-js/utils';

import {
  type RsbuildInstance,
  logger,
  type DevConfig,
  type ServerConfig,
  type Rspack,
} from '@rsbuild/core';

import type { ModernDevServerOptions } from '@modern-js/server';
import type { Server } from 'node:http';
import {
  applyPlugins,
  type ApplyPlugins,
  type ProdServerOptions as ModernServerOptions,
} from '@modern-js/prod-server';
import type {
  UniBuilderConfig,
  ToolsDevServerConfig,
  DevServerHttpsOptions,
} from '../types';

type ServerOptions = Partial<Omit<ModernDevServerOptions, 'config'>> & {
  config?: Partial<ModernDevServerOptions['config']>;
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
    dev: {},
    security: {},
  };
};

export const transformToRsbuildServerOptions = (
  dev: NonNullable<UniBuilderConfig['dev']>,
  devServer: ToolsDevServerConfig,
): {
  dev: DevConfig;
  server: ServerConfig;
} => {
  const { port = 8080, host, https, ...devConfig } = dev;

  const newDevServerConfig = applyOptionsChain(
    {
      devMiddleware: {
        writeToDisk: (file: string) => !file.includes('.hot-update.'),
      },
      hot: dev?.hmr ?? true,
      liveReload: true,
      client: {
        path: '/webpack-hmr',
        overlay: false,
        ...(devConfig.client || {}),
      },
    },
    devServer,
    {},
    merge,
  );

  const rsbuildDev: DevConfig = {
    writeToDisk: newDevServerConfig.devMiddleware?.writeToDisk,
    hmr: newDevServerConfig.hot,
    liveReload: newDevServerConfig.liveReload,
    ...devConfig,
    client: {
      ...newDevServerConfig.client,
      ...(devConfig.client || {}),
    },
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
        printUrls: false,
      }
    : {
        publicDir: false,
        htmlFallback: false,
        printUrls: false,
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
  config: ModernDevServerOptions['config'];
}> => {
  const defaultConfig = getServerOptions(builderConfig);
  const config = serverOptions.config
    ? (merge(defaultConfig, serverOptions.config) as typeof defaultConfig)
    : defaultConfig;

  return { config };
};

export type StartDevServerOptions = {
  compiler?: Rspack.Compiler | Rspack.MultiCompiler;
  getPortSilently?: boolean;
  apiOnly?: boolean;
  serverOptions?: ServerOptions;
  applyPlugins?: ApplyPlugins;
};

export type UniBuilderStartServerResult = {
  server: Server;
  port: number;
};

export async function startDevServer(
  rsbuild: RsbuildInstance,
  options: StartDevServerOptions = {},
  builderConfig: UniBuilderConfig,
) {
  logger.debug('create dev server');

  if (!options.applyPlugins) {
    options.applyPlugins = applyPlugins;
  }

  const { createDevServer } = await import('@modern-js/server');

  const rsbuildServer = await rsbuild.createDevServer({
    ...options,
    runCompile: !options.apiOnly,
  });

  const { serverOptions = {} } = options;

  const { config } = await getDevServerOptions({
    builderConfig,
    serverOptions,
  });

  const rsbuildConfig = rsbuild.getNormalizedConfig();

  const https = serverOptions.dev?.https ?? rsbuildConfig.server.https;

  const { port } = rsbuildServer;
  const {
    server: { host },
    dev: { writeToDisk },
  } = rsbuildConfig;

  const server = await createDevServer(
    {
      pwd: rsbuild.context.rootPath,
      ...serverOptions,
      appContext: serverOptions.appContext || {},
      rsbuild,
      getMiddlewares: () => ({
        middlewares: rsbuildServer.middlewares,
        close: rsbuildServer.close,
        onHTTPUpgrade: rsbuildServer.onHTTPUpgrade,
      }),
      dev: {
        watch: serverOptions.dev?.watch ?? true,
        https: https as DevServerHttpsOptions,
        writeToDisk,
      },
      config,
    },
    options.applyPlugins,
  );

  logger.debug('listen dev server');

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

        logger.debug('listen dev server done');

        await rsbuildServer.afterListen();

        resolve({
          port,
          server,
        });
      },
    );
  });
}
