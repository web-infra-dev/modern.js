import { UnwrapBuilderConfig } from '../utils';
import type {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';

export type { SharedPerformanceConfig } from '@modern-js/builder-shared';

export type BuilderPerformanceConfig = UnwrapBuilderConfig<
  WebpackBuilderConfig,
  'performance'
>;
export type RsPerformanceConfig = UnwrapBuilderConfig<
  RspackBuilderConfig,
  'performance'
>;

export type PerformanceUserConfig = BuilderPerformanceConfig;
