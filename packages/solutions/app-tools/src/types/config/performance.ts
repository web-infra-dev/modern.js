import type { UniBuilderConfig } from '@modern-js/uni-builder';
import type { UnwrapBuilderConfig } from '../utils';

export type PerformanceUserConfig = UnwrapBuilderConfig<
  UniBuilderConfig,
  'performance'
>;
