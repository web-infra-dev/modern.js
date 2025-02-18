import type { Monitors } from '@modern-js/types';

export const defaultMonitors: Omit<Monitors, 'push'> = {
  counter(name, ...args) {},
  info(message, ...args) {},
  debug(message, ...args) {},
  trace(message, ...args) {},
  warn(message, ...args) {},
  error(message, ...args) {},
  timing(name, dur, ...args) {},
};
