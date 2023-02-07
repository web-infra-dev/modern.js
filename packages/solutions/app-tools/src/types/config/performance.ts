import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';
import { UnwrapBuilderConfig } from '../utils';

export type { SharedPerformanceConfig } from '@modern-js/builder-shared';

export type BuilderPerformanceConfig = UnwrapBuilderConfig<
  BuilderConfig,
  'performance'
>;
export type RsPerformanceConfig = UnwrapBuilderConfig<
  RsBuilderConfig,
  'performance'
>;

export type PerformanceUserConfig = BuilderPerformanceConfig;
