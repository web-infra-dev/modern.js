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
  const { host, https, startUrl, beforeStartUrl, ...devConfig } = dev;

  const port = process.env.PORT
    ? Number(process.env.PORT)
    : (server?.port ?? 8080);
  const rsbuildDev: DevConfig = merge(defaultDevConfig, devConfig);
  // setupMiddlewares apply by @modern-js/server
  delete rsbuildDev.setupMiddlewares;

  // TODO: why devServer type is config chain?
  const serverCofig = applyOptionsChain({}, devServer, {}, merge);
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
