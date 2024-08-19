import { proxy } from 'valtio';
import type { StorageStatus } from './shared';

export const $storage = proxy<StorageStatus>({
  cookie: {
    client: {},
    server: {},
  },
  localStorage: {},
  sessionStorage: {},
});
