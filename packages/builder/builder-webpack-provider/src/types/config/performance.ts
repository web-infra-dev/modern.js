import type {
  SharedPerformanceConfig,
  NormalizedSharedPerformanceConfig,
} from '@modern-js/builder-shared';

export type PerformanceConfig = SharedPerformanceConfig & {
  /**
   * Whether to remove the locales of [moment.js](https://momentjs.com/).
   */
  removeMomentLocale?: boolean;
  /**
   * Whether capture timing information for each module,
   * same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of webpack.
   */
  profile?: boolean;
};

export type NormalizedPerformanceConfig = Required<
  Pick<PerformanceConfig, 'removeMomentLocale' | 'profile'>
> &
  NormalizedSharedPerformanceConfig;
