import type { BuilderConfig } from '@modern-js/uni-builder';
import type { UnwrapBuilderConfig } from '../utils';

export type PerformanceUserConfig = UnwrapBuilderConfig<
  BuilderConfig,
  'performance'
>;
