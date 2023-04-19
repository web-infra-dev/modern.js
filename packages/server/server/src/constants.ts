import { HMR_SOCK_PATH } from '@modern-js/utils/universal/constants';
import { DevServerOptions } from './types';

export const getDefaultDevOptions = (): DevServerOptions => {
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
    liveReload: true,
  };
};
