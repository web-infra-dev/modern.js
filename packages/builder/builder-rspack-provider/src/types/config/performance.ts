import type { SharedPerformanceConfig } from '@modern-js/builder-shared';

// TODO
export type PerformanceConfig = Pick<
  SharedPerformanceConfig,
  'printFileSize' | 'buildCache'
>;

export type NormalizedPerformanceConfig = Required<PerformanceConfig>;
