import { ReactDevtoolsWallEvent } from '@/utils/react-devtools';

export interface ClientFunctions {
  sendReactDevtoolsData: (e: ReactDevtoolsWallEvent) => Promise<void>;
  onMountPointConnect: () => Promise<void>;
}

export interface MountPointFunctions {
  sendReactDevtoolsData: (e: ReactDevtoolsWallEvent) => Promise<void>;
  activateReactDevtools: () => Promise<void>;
}

export const CLIENT_CONNECT_EVENT = 'modern_js_devtools::client::connect';

export type ClientConnectEventType = typeof CLIENT_CONNECT_EVENT;
