import { ReactDevtoolsWallEvent } from '@/utils/react-devtools';

export interface ClientFunctions {
  sendReactDevtoolsData: (e: ReactDevtoolsWallEvent) => Promise<void>;
}

export interface MountPointFunctions {
  sendReactDevtoolsData: (e: ReactDevtoolsWallEvent) => Promise<void>;
  activateReactDevtools: () => Promise<void>;
}
