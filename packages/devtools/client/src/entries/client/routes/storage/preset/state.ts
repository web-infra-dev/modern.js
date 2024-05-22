import { proxy } from 'valtio';
import { StorageStatus } from './shared';

export const $storage = proxy<StorageStatus>({
  cookie: {
    client: {},
    server: {},
  },
  localStorage: {},
  sessionStorage: {},
});
