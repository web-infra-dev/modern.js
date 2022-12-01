import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderPerformanceConfig = Required<BuilderConfig>['performance'];

export type PerformanceUserConfig = BuilderPerformanceConfig;

export type PerformanceNormalizedConfig = PerformanceUserConfig;
