import { HMR_SOCK_PATH } from '@modern-js/utils/universal/constants';
import { DevServerOptions } from './types';

export const getDefaultDevOptions = (): DevServerOptions => {
  return {
    client: {
      // using current port
      port: '',
      // using current hostname
      host: '',
      path: HMR_SOCK_PATH,
    },
    https: false,
    devMiddleware: { writeToDisk: true },
    watch: true,
    hot: true,
    liveReload: true,
  };
};
