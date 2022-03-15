import { HMR_SOCK_PATH } from '@modern-js/utils';
import { DevServerOptions } from './types';

export const DEFAULT_DEV_OPTIONS: DevServerOptions = {
  client: {
    port: '8080',
    overlay: false,
    logging: 'none',
    path: HMR_SOCK_PATH,
    host: 'localhost',
  },
  https: false,
  dev: { writeToDisk: true },
  watch: true,
  hot: true,
  liveReload: true,
};
