import type { SharedPerformanceConfig } from '@modern-js/builder-shared';

// TODO
export type PerformanceConfig = Pick<SharedPerformanceConfig, 'printFileSize'>;

export type NormalizedPerformanceConfig = PerformanceConfig;
