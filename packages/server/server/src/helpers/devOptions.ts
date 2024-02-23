import { DevServerOptions } from '@modern-js/types';
import { merge } from '@modern-js/utils/lodash';
import { DevMiddlewaresConfig } from '@rsbuild/shared';
import { getDefaultDevOptions } from '../constants';
import { ModernDevServerOptions } from '../types';

export const getDevOptions = (options: ModernDevServerOptions) => {
  const devOptions = options.dev;
  const defaultOptions = getDefaultDevOptions();
  return merge(defaultOptions, devOptions);
};

export const transformToRsbuildServerOptions = (
  dev: DevServerOptions,
): DevMiddlewaresConfig => {
  const rsbuildOptions: DevMiddlewaresConfig = {
    hmr: Boolean(dev.hot),
    client: dev.client,
    writeToDisk: dev.devMiddleware?.writeToDisk,
    compress: dev.compress,
    headers: dev.headers,
    historyApiFallback: dev.historyApiFallback,
    proxy: dev.proxy,
    publicDir: false,
  };
  if (dev.before?.length || dev.after?.length) {
    rsbuildOptions.setupMiddlewares = [
      ...(dev.setupMiddlewares || []),
      middlewares => {
        // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
        middlewares.unshift(...(dev.before || []));

        middlewares.push(...(dev.after || []));
      },
    ];
  } else if (dev.setupMiddlewares) {
    rsbuildOptions.setupMiddlewares = dev.setupMiddlewares;
  }

  return rsbuildOptions;
};
