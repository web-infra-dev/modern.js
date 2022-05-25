import { getIpv4Interfaces, HMR_SOCK_PATH } from '@modern-js/utils';
import { DevServerOptions } from './types';

export const getDefaultDevOptions = (): DevServerOptions => {
  const network = getIpv4Interfaces().find(item => !item.internal);
  return {
    client: {
      port: '8080',
      overlay: false,
      logging: 'none',
      path: HMR_SOCK_PATH,
      host: network?.address || 'localhost',
    },
    https: false,
    devMiddleware: { writeToDisk: true },
    watch: true,
    hot: true,
    liveReload: true,
  };
};
