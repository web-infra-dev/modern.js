export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

// may extends cache options in the futures
export type BuildCacheOptions = {
  /** the build file cache directory. */
  cacheDirectory?: string;
};

export interface SharedPerformanceConfig {
  removeConsole?: boolean | ConsoleType[];
  removeMomentLocale?: boolean;
  buildCache?: BuildCacheOptions | boolean;
  profile?: boolean;
}
