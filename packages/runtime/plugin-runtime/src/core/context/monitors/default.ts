import type { Monitors } from '@modern-js/types';

export const defaultMonitors: Omit<Monitors, 'push'> = {
  counter(_name: string, ..._args: any[]) {},

  info: console.info,
  debug: console.debug,
  trace: console.trace,
  warn: console.warn,
  error: console.error,

  timing(_name: string, _dur: number, ..._args: any[]) {},
};
