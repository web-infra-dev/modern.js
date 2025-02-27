import { storage } from '@modern-js/runtime-utils/node';
import type { Monitors } from '@modern-js/types';
import { defaultMonitors } from './default';

export const getMonitors = (): Omit<Monitors, 'push'> => {
  const storageContext = storage.useContext();
  return storageContext.monitors || defaultMonitors;
};
