import { merge } from 'ts-deepmerge';
import { applyOptionsChain, isProd } from '@modern-js/utils';

import type { DevConfig, ServerConfig } from '@rsbuild/core';

import type { UniBuilderConfig, ToolsDevServerConfig } from '../types';

const transformDevSetupMiddlewares = (
  seuptMiddlewares: DevConfig['setupMiddlewares'],
): DevConfig['setupMiddlewares'] => {
  if (seuptMiddlewares) {
    const newSetupMiddlewares: DevConfig['setupMiddlewares'] =
      seuptMiddlewares.map(handler => (_, server) => {
        handler(
          {
            unshift() {
              // ignore
            },
            push() {
              // ignore
            },
          },
          server,
        );
      });
    return newSetupMiddlewares;
  }
  return undefined;
};

export const transformToRsbuildServerOptions = (
  dev: NonNullable<UniBuilderConfig['dev']>,
  devServer: ToolsDevServerConfig,
): {
  dev: DevConfig;
  server: ServerConfig;
} => {
  const {
    port = 8080,
    host,
    https,
    startUrl,
    beforeStartUrl,
    ...devConfig
  } = dev;

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
        port: '<port>',
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

  // devConfig.setupMiddlewares, devConfig.after, devConfig.before  apply by @modern-js/server
  // setupMiddlewares apply by @modern-js/server
  rsbuildDev.setupMiddlewares = transformDevSetupMiddlewares(
    newDevServerConfig.setupMiddlewares,
  );

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

  if (!isProd() && startUrl) {
    server.open = beforeStartUrl
      ? {
          target: startUrl === true ? '//localhost:<port>' : startUrl,
          before: beforeStartUrl,
        }
      : startUrl;
  }

  return { dev: rsbuildDev, server };
};
