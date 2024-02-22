import { DevServerOptions } from '@modern-js/types';
import { merge } from '@modern-js/utils/compiled/lodash';
import { DevMiddlewaresConfig } from '@rsbuild/shared';
import { HMR_SOCK_PATH } from '@modern-js/utils/universal/constants';
import { ModernDevServerOptions } from '../types';

const getDefaultDevOptions = (): DevServerOptions => {
  return {
    client: {
      path: HMR_SOCK_PATH,
      // By default it is set to the port number of the dev server
      port: '',
      // By default it is set to "location.hostname"
      host: '',
      // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
      protocol: '',
    },
    https: false,
    devMiddleware: { writeToDisk: true },
    watch: true,
    hot: true,
    compress: true,
    liveReload: true,
  };
};

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
