export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

export interface PerformanceConfig {
  removeConsole?: boolean | ConsoleType[];
  removeMomentLocale?: boolean;
}
