export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

// may extends cache options in the futures
export type BuildCacheOptions = {
  /** Base directory for the filesystem cache. */
  cacheDirectory?: string;
};

export interface SharedPerformanceConfig {
  /**
   * Whether to remove `console.xx` in production build.
   */
  removeConsole?: boolean | ConsoleType[];
  /**
   * Whether to remove the locales of [moment.js](https://momentjs.com/).
   */
  removeMomentLocale?: boolean;
  /**
   * Controls the Builder's caching behavior during the build process.
   */
  buildCache?: BuildCacheOptions | boolean;
  /**
   * Whether capture timing information for each module,
   * same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of webpack.
   */
  profile?: boolean;
  /**
   * Whether to print the file sizes after production build.
   */
  printFileSize?: boolean;
}
