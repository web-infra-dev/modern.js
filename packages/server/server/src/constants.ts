import { getIpv4Interfaces } from '@modern-js/utils';
import { HMR_SOCK_PATH } from '@modern-js/utils/universal/constants';
import { DevServerOptions } from './types';

export const getDefaultDevOptions = (): DevServerOptions => {
  const network = getIpv4Interfaces().find(item => !item.internal);
  return {
    client: {
      port: '8080',
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
