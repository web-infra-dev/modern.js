import { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
import { $mountPoint, $server } from '../state';

export interface Data {
  presets: StoragePresetContext[];
  storage: {
    cookie: { client: Record<string, string>; server: Record<string, string> };
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
}

export const loader = async (): Promise<Data> => {
  const mountPoint = await $mountPoint;
  const server = await $server;
  const [cookie, localStorage, sessionStorage, config] = await Promise.all([
    mountPoint.remote.cookies(),
    mountPoint.remote.localStorage(),
    mountPoint.remote.sessionStorage(),
    server.remote.getDevtoolsConfig(),
  ]);
  return {
    presets: config.storagePresets || [],
    storage: {
      cookie,
      localStorage,
      sessionStorage,
    },
  };
};
