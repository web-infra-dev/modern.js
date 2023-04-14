import { HMR_SOCK_PATH } from '@modern-js/utils/universal/constants';
import { DevServerOptions } from './types';

export const getDefaultDevOptions = (): DevServerOptions => {
  return {
    client: {
      path: HMR_SOCK_PATH,
      // This will fallback to "location.port"
      port: '',
      // This will fallback to "location.hostname"
      host: '',
      // This will fallback to "location.protocol === 'https:' ? 'wss' : 'ws'"
      protocol: '',
    },
    https: false,
    devMiddleware: { writeToDisk: true },
    watch: true,
    hot: true,
    liveReload: true,
  };
};
