export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

export interface WebBuilderPerformanceConfig {
  removeConsole?: boolean | ConsoleType[];
  removeMomentLocale?: boolean;
}
