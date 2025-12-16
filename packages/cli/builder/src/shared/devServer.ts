import { applyOptionsChain, isProd } from '@modern-js/utils';
import { merge } from 'ts-deepmerge';

import type { DevConfig, ServerConfig } from '@rsbuild/core';

import type { BuilderConfig, ToolsDevServerConfig } from '../types';

const defaultDevConfig = {
  writeToDisk: (file: string) => !file.includes('.hot-update.'),
  hmr: true,
  liveReload: true,
  progressBar: true,
  client: {
    path: '/webpack-hmr',
    overlay: false,
    port: '<port>',
  },
};

export const transformToRsbuildServerOptions = (
  dev: NonNullable<BuilderConfig['dev']>,
  devServer: ToolsDevServerConfig,
  server?: BuilderConfig['server'],
): {
  rsbuildDev: DevConfig;
  rsbuildServer: ServerConfig;
} => {
  const {
    host,
    https,
    startUrl,
    beforeStartUrl,
    server: devServerConfig,
    ...devConfig
  } = dev;

  const port = process.env.PORT
    ? Number(process.env.PORT)
    : (server?.port ?? 8080);
  const rsbuildDev: DevConfig = merge(defaultDevConfig, devConfig);
  // setupMiddlewares apply by @modern-js/server
  delete rsbuildDev.setupMiddlewares;

  // TODO: why devServer type is config chain?
  const legacyServerConfig = applyOptionsChain({}, devServer, {}, merge);

  // Priority: dev.server > tools.devServer (soft compatibility)
  // Note: watch is not a rsbuild ServerConfig option, so it's not passed to rsbuildServer
  const serverCofig = {
    compress: devServerConfig?.compress ?? legacyServerConfig.compress,
    headers: devServerConfig?.headers ?? legacyServerConfig.headers,
    historyApiFallback:
      devServerConfig?.historyApiFallback ??
      legacyServerConfig.historyApiFallback,
    proxy: devServerConfig?.proxy ?? legacyServerConfig.proxy,
  };

  const rsbuildServer: ServerConfig = isProd()
    ? {
        publicDir: false,
        htmlFallback: false,
        printUrls: false,
      }
    : {
        publicDir: false,
        htmlFallback: false,
        printUrls: false,
        compress: serverCofig.compress,
        headers: serverCofig.headers,
        historyApiFallback: serverCofig.historyApiFallback,
        proxy: serverCofig.proxy,
        host,
        port,
        https: https ? (https as ServerConfig['https']) : undefined,
        middlewareMode: true,
        cors: server?.cors,
      };

  if (!isProd() && startUrl) {
    rsbuildServer.open = beforeStartUrl
      ? {
          target: startUrl === true ? '//localhost:<port>' : startUrl,
          before: beforeStartUrl,
        }
      : startUrl;
  }

  return { rsbuildDev, rsbuildServer };
};
