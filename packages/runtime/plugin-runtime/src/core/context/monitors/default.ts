import type { Monitors } from '@modern-js/types';

export const defaultMonitors: Omit<Monitors, 'push'> = {
  counter(name: string, ...args: any[]) {},

  info: console.info,
  debug: console.debug,
  trace: console.trace,
  warn: console.warn,
  error: console.error,

  timing(name: string, dur: number, ...args: any[]) {},
};
